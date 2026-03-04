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
import * as path from 'path';
import { Candidature, EmailStatus } from './entities/candidature.entity';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class CandidaturesService {
    private readonly logger = new Logger(CandidaturesService.name);

    constructor(
        @InjectRepository(Candidature)
        private readonly candidatureRepo: Repository<Candidature>,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }

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
                emailStatus: EmailStatus.PENDING, // ← important
            });

            const saved = await this.candidatureRepo.save(candidature);

            // Recharger avec relation offre
            const withOffre = await this.candidatureRepo.findOne({
                where: { id: saved.id },
                relations: ['offre'],
            });

            if (withOffre) {
                // Envoi asynchrone – ne bloque PAS la réponse HTTP
                setImmediate(async () => {
                    try {
                        await this.mailService.sendCandidatureNotification(withOffre);
                        // Succès → mise à jour statut
                        await this.candidatureRepo.update(saved.id, {
                            emailStatus: EmailStatus.SENT,
                        });
                        this.logger.log(
                            `Email envoyé avec succès pour candidature ${saved.id}`,
                        );
                    } catch (err) {
                        this.logger.error(
                            `Échec envoi email candidature ${saved.id} : ${err.message}`,
                            err.stack,
                        );
                        await this.candidatureRepo.update(saved.id, {
                            emailStatus: EmailStatus.FAILED,
                            emailErrorMessage: err.message?.substring(0, 500) || 'Unknown error',
                        });
                    }
                });
            }

            // On retourne immédiatement la candidature (sans attendre l'email)
            return saved;
        } catch (err) {
            this.safeDeleteFile(cvFile.path);
            if (lettreFile) this.safeDeleteFile(lettreFile.path);
            throw new InternalServerErrorException("Erreur lors de l'enregistrement de la candidature");
        }
    }

    findAll(): Promise<Candidature[]> {
        return this.candidatureRepo.find({
            order: { createdAt: 'DESC' },
            relations: ['offre'],
        });
    }

    findByOffre(offreId: number): Promise<Candidature[]> {
        return this.candidatureRepo.find({
            where: { offreId },
            order: { createdAt: 'DESC' },
        });
    }

    getFileUrl(filename: string, type: 'cv' | 'lettre'): string {
        const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
        return `${baseUrl}/uploads/candidatures/${type}/${filename}`;
    }

    private safeDeleteFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
            // Silently fail — log en prod
        }
    }
}