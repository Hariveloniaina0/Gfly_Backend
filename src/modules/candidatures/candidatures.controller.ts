// candidatures/candidatures.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CandidaturesService } from './candidatures.service';
import { CreateCandidatureDto } from './dto/create-candidature.dto';
import { QueryCandidaturesDto } from './dto/query-candidatures.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

const UPLOAD_BASE   = join(process.cwd(), 'uploads', 'candidatures');
const ALLOWED_TYPES = /pdf|doc|docx/;
const MAX_SIZE      = 5 * 1024 * 1024; // 5 MB

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@Controller('candidatures')
export class CandidaturesController {
  constructor(private readonly candidaturesService: CandidaturesService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // POST /candidatures  (public — dépôt de candidature)
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv',     maxCount: 1 },
        { name: 'lettre', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (_req, file, cb) => {
            const subDir = file.fieldname === 'cv' ? 'cv' : 'lettre';
            const dest   = join(UPLOAD_BASE, subDir);
            ensureDir(dest);
            cb(null, dest);
          },
          filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${extname(file.originalname)}`);
          },
        }),
        limits: { fileSize: MAX_SIZE },
        fileFilter: (_req, file, cb) => {
          const isValid = ALLOWED_TYPES.test(
            extname(file.originalname).slice(1).toLowerCase(),
          );
          if (!isValid) {
            return cb(
              new BadRequestException(
                'Seuls les fichiers PDF, DOC et DOCX sont acceptés',
              ),
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

  // ─────────────────────────────────────────────────────────────────────────
  // GET /candidatures  (admin — liste paginée + filtres)
  //
  // Query params disponibles :
  //   page, limit, search, offreId, emailStatus,
  //   dateFrom, dateTo, sortBy, sortOrder
  // ─────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryCandidaturesDto,
  ) {
    return this.candidaturesService.findAll(query);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /candidatures/offre/:offreId  (admin — filtrée + paginée)
  // ─────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('offre/:offreId')
  findByOffre(
    @Param('offreId', ParseIntPipe) offreId: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryCandidaturesDto,
  ) {
    return this.candidaturesService.findByOffre(offreId, query);
  }
}