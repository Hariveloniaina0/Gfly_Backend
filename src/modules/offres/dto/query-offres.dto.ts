import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryOffresDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Recherche full-text : titre, lieu, typeContrat, description */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? '')
  search?: string;

  /** Filtrer par type de contrat */
  @IsOptional()
  @IsString()
  typeContrat?: string;

  /** Filtrer par date de publication (ISO string) */
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  /** Tri */
  @IsOptional()
  @IsIn(['datePublication', 'titre', 'lieu', 'createdAt'])
  sortBy?: 'datePublication' | 'titre' | 'lieu' | 'createdAt' = 'datePublication';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}