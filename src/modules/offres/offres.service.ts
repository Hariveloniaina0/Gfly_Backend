import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offre } from './entities/offre.entity';
import { CreateOffreDto } from './dto/create-offre.dto';
import { UpdateOffreDto } from './dto/update-offre.dto';
import { QueryOffresDto } from './dto/query-offres.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class OffresService {
  constructor(
    @InjectRepository(Offre)
    private readonly offreRepository: Repository<Offre>,
  ) {}

  async create(createOffreDto: CreateOffreDto): Promise<Offre> {
    const offre = this.offreRepository.create(createOffreDto);
    return this.offreRepository.save(offre);
  }

  async findAll(query: QueryOffresDto): Promise<PaginatedResult<Offre>> {
    const {
      page = 1,
      limit = 20,
      search,
      typeContrat,
      dateFrom,
      dateTo,
      sortBy = 'datePublication',
      sortOrder = 'DESC',
    } = query;

    const qb = this.offreRepository.createQueryBuilder('o');

    // ── Recherche full-text ───────────────────────────────────────────────
    if (search && search.length > 0) {
      qb.andWhere(
        `(
          LOWER(o.titre)       LIKE :search OR
          LOWER(o.lieu)        LIKE :search OR
          LOWER(o.typeContrat) LIKE :search OR
          LOWER(o.description) LIKE :search
        )`,
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // ── Filtres ───────────────────────────────────────────────────────────
    if (typeContrat) {
      qb.andWhere('o.typeContrat = :typeContrat', { typeContrat });
    }

    if (dateFrom) {
      qb.andWhere('o.datePublication >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('o.datePublication <= :dateTo', { dateTo: end });
    }

    // ── Tri ───────────────────────────────────────────────────────────────
    const sortColumn =
      sortBy === 'titre'   ? 'o.titre'
      : sortBy === 'lieu'  ? 'o.lieu'
      : sortBy === 'createdAt' ? 'o.createdAt'
      : 'o.datePublication';

    qb.orderBy(sortColumn, sortOrder);

    // ── Pagination ────────────────────────────────────────────────────────
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    // ── Exécution ─────────────────────────────────────────────────────────
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

  async findOne(id: number): Promise<Offre> {
    const offre = await this.offreRepository.findOne({ where: { id } });
    if (!offre) throw new NotFoundException('Offre introuvable');
    return offre;
  }

  async getImageUrl(id: number): Promise<string> {
    const offre = await this.findOne(id);
    if (!offre.imageUrl) throw new NotFoundException("Cette offre n'a pas d'image");
    return offre.imageUrl;
  }

  async update(id: number, updateOffreDto: UpdateOffreDto): Promise<Offre> {
    const offre = await this.findOne(id);
    Object.assign(offre, updateOffreDto);
    return this.offreRepository.save(offre);
  }

  async remove(id: number): Promise<{ message: string }> {
    const offre = await this.findOne(id);
    await this.offreRepository.remove(offre);
    return { message: 'Offre supprimée avec succès' };
  }
}