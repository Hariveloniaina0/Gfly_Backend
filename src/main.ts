import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // ── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : [];

  if (allowedOrigins.length === 0) {
    console.warn('[CORS] ⚠️  FRONTEND_URL non définie — aucune origine autorisée');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS] Origine bloquée : ${origin}`);
        callback(new Error(`Origine non autorisée par CORS : ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Static assets ─────────────────────────────────────────────────────────
  const uploadsRoot = join(process.cwd(), 'uploads');

  app.useStaticAssets(join(uploadsRoot, 'offres'), {
    prefix: '/uploads/offres',
  });

  app.useStaticAssets(join(uploadsRoot, 'candidatures'), {
    prefix: '/uploads/candidatures',
  });

  // ── Listen ────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();