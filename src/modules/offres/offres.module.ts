import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offre } from './entities/offre.entity';
import { OffresService } from './offres.service';
import { OffresController } from './offres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Offre])],
  providers: [OffresService],
  controllers: [OffresController],
})
export class OffresModule {}