import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
    ParseUUIDPipe,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CandidaturesService } from './candidatures.service';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

const UPLOAD_BASE = join(process.cwd(), 'uploads', 'candidatures');
const ALLOWED_DOC_TYPES = /pdf|doc|docx/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function ensureDir(dir: string): void {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function buildStorage(subDir: string) {
    return diskStorage({
        destination: (_req, _file, cb) => {
            const dest = join(UPLOAD_BASE, subDir);
            ensureDir(dest);
            cb(null, dest);
        },
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${extname(file.originalname)}`);
        },
    });
}

@Controller('candidatures')
export class CandidaturesController {
    constructor(private readonly candidaturesService: CandidaturesService) { }

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'cv', maxCount: 1 },
                { name: 'lettre', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: (_req, file, cb) => {
                        const subDir = file.fieldname === 'cv' ? 'cv' : 'lettre';
                        const dest = join(UPLOAD_BASE, subDir);
                        ensureDir(dest);
                        cb(null, dest);
                    },
                    filename: (_req, file, cb) => {
                        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                        cb(null, `${unique}${extname(file.originalname)}`);
                    },
                }),
                limits: { fileSize: MAX_FILE_SIZE },
                fileFilter: (_req, file, cb) => {
                    const isValid = ALLOWED_DOC_TYPES.test(
                        extname(file.originalname).slice(1).toLowerCase(),
                    );
                    if (!isValid) {
                        return cb(
                            new BadRequestException('Seuls les fichiers PDF, DOC et DOCX sont acceptés'),
                            false,
                        );
                    }
                    cb(null, true);
                },
            },
        ),
    )
    async create(
        @Body() dto: CreateCandidatureDto,
        @UploadedFiles()
        files: { cv?: Express.Multer.File[]; lettre?: Express.Multer.File[] },
    ) {
        return this.candidaturesService.create(dto, files);
    }

    /* ── Admin routes ── */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    findAll() {
        return this.candidaturesService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('offre/:offreId')
    findByOffre(@Param('offreId', ParseIntPipe) offreId: number) {
        return this.candidaturesService.findByOffre(offreId);
    }
}