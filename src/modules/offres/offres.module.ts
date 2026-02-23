import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffresController } from './offres.controller';
import { OffresService } from './offres.service';
import { Offre } from './entities/offre.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offre]),
    AuthModule,
  ],
  controllers: [OffresController],
  providers: [OffresService],
})
export class OffresModule {}