import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/offres',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const isValid = allowedTypes.test(file.mimetype);
        if (!isValid) {
          return callback(
            new BadRequestException('Seuls les fichiers JPG, PNG et WEBP sont acceptés'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');

    const imageUrl = `${process.env.BASE_URL}/uploads/offres/${file.filename}`;
    return { imageUrl };
  }
}