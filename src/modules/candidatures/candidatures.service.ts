// candidatures/candidatures.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { Candidature, EmailStatus } from './entities/candidature.entity';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { QueryCandidaturesDto } from './dto/query-candidatures.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class CandidaturesService {
  private readonly logger = new Logger(CandidaturesService.name);

  constructor(
    @InjectRepository(Candidature)
    private readonly candidatureRepo: Repository<Candidature>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  async create(
    dto: CreateCandidatureDto,
    files: { cv?: Express.Multer.File[]; lettre?: Express.Multer.File[] },
  ): Promise<Candidature> {
    const cvFile = files?.cv?.[0];
    if (!cvFile) throw new BadRequestException('Le CV est obligatoire');

    const lettreFile = files?.lettre?.[0];

    try {
      const candidature = this.candidatureRepo.create({
        nomPrenom: dto.nomPrenom,
        ville: dto.ville,
        email: dto.email,
        telephone: dto.telephone,
        offreId: dto.offreId,
        cvFilename: cvFile.originalname,
        cvPath: cvFile.filename,
        lettreFilename: lettreFile?.originalname,
        lettrePath: lettreFile?.filename,
        emailStatus: EmailStatus.PENDING,
      });

      const saved = await this.candidatureRepo.save(candidature);

      // Envoi email asynchrone (ne bloque pas la réponse)
      const withOffre = await this.candidatureRepo.findOne({
        where: { id: saved.id },
        relations: ['offre'],
      });

      if (withOffre) {
        setImmediate(async () => {
          try {
            await this.mailService.sendCandidatureNotification(withOffre);
            await this.candidatureRepo.update(saved.id, {
              emailStatus: EmailStatus.SENT,
            });
            this.logger.log(`Email envoyé pour candidature ${saved.id}`);
          } catch (err) {
            this.logger.error(
              `Échec email candidature ${saved.id}: ${err.message}`,
              err.stack,
            );
            await this.candidatureRepo.update(saved.id, {
              emailStatus: EmailStatus.FAILED,
              emailErrorMessage: err.message?.substring(0, 500) || 'Unknown error',
            });
          }
        });
      }

      return saved;
    } catch (err) {
      this.safeDeleteFile(cvFile.path);
      if (lettreFile) this.safeDeleteFile(lettreFile.path);
      throw new InternalServerErrorException(
        "Erreur lors de l'enregistrement de la candidature",
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND ALL — paginé + filtres + recherche serveur
  // ─────────────────────────────────────────────────────────────────────────────

  async findAll(
    query: QueryCandidaturesDto,
  ): Promise<PaginatedResult<Candidature>> {
    const {
      page = 1,
      limit = 20,
      search,
      offreId,
      emailStatus,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.candidatureRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.offre', 'offre');

    // ── Recherche full-text ───────────────────────────
    if (search && search.length > 0) {
      qb.andWhere(
        `(
          LOWER(c.nomPrenom) LIKE :search OR
          LOWER(c.email)     LIKE :search OR
          LOWER(c.ville)     LIKE :search OR
          LOWER(c.telephone) LIKE :search OR
          LOWER(offre.titre) LIKE :search
        )`,
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // ── Filtres ──────────────────────────────────────────────────────────────
    if (offreId) {
      qb.andWhere('c.offreId = :offreId', { offreId });
    }

    if (emailStatus) {
      qb.andWhere('c.emailStatus = :emailStatus', { emailStatus });
    }

    if (dateFrom) {
      qb.andWhere('c.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      // Inclure toute la journée de dateTo
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('c.createdAt <= :dateTo', { dateTo: end });
    }

    // ── Tri ──────────────────────────────────────────────────────────────────
    const sortColumn =
      sortBy === 'nomPrenom' ? 'c.nomPrenom'
      : sortBy === 'email'   ? 'c.email'
      : sortBy === 'ville'   ? 'c.ville'
      : 'c.createdAt';

    qb.orderBy(sortColumn, sortOrder);

    // ── Pagination ───────────────────────────────────────────────────────────
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset    = (safePage - 1) * safeLimit;

    qb.skip(offset).take(safeLimit);

    // ── Exécution ────────────────────────────────────────────────────────────
    const [data, total] = await qb.getManyAndCount();

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FIND BY OFFRE — délègue vers findAll avec offreId fixé
  // ─────────────────────────────────────────────────────────────────────────────

  findByOffre(
    offreId: number,
    query: Omit<QueryCandidaturesDto, 'offreId'>,
  ): Promise<PaginatedResult<Candidature>> {
    return this.findAll({ ...query, offreId });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────────────────────────────────────

  getFileUrl(filename: string, type: 'cv' | 'lettre'): string {
    return `${this.configService.get<string>('BASE_URL')}/uploads/candidatures/${type}/${filename}`;
  }

  private safeDeleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      /* silently fail */
    }
  }
}