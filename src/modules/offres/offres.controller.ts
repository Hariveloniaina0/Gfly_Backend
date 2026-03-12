import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OffresService } from './offres.service';
import { CreateOffreDto } from './dto/create-offre.dto';
import { UpdateOffreDto } from './dto/update-offre.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Query, ValidationPipe } from '@nestjs/common';
import { QueryOffresDto } from './dto/query-offres.dto';

@Controller('offres')
export class OffresController {
  constructor(private readonly offresService: OffresService) {}

@Get()
findAll(
  @Query(new ValidationPipe({ transform: true, whitelist: true }))
  query: QueryOffresDto,
) {
  return this.offresService.findAll(query);
}
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offresService.findOne(id);
  }

  @Get(':id/image')
  async getImage(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const imageUrl = await this.offresService.getImageUrl(id);
    return res.redirect(imageUrl);
  }

  // Protégé — admin uniquement
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createOffreDto: CreateOffreDto) {
    return this.offresService.create(createOffreDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOffreDto: UpdateOffreDto,
  ) {
    return this.offresService.update(id, updateOffreDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.offresService.remove(id);
  }
}