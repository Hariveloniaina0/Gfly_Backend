import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offre } from './entities/offre.entity';
import { CreateOffreDto } from './dto/create-offre.dto';
import { UpdateOffreDto } from './dto/update-offre.dto';

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

  async findAll(): Promise<Offre[]> {
    return this.offreRepository.find({ order: { datePublication: 'DESC' } });
  }

  async findOne(id: number): Promise<Offre> {
    const offre = await this.offreRepository.findOne({ where: { id } });
    if (!offre) throw new NotFoundException('Offre introuvable');
    return offre;
  }

  async getImageUrl(id: number): Promise<string> {
  const offre = await this.findOne(id);

  if (!offre.imageUrl) {
    throw new NotFoundException("Cette offre n'a pas d'image");
  }

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