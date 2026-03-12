// candidatures/dto/query-candidatures.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCandidaturesDto {
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

  /** Recherche full-text : nom, email, ville, titre offre */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ?? '')
  search?: string;

  /** Filtrer par offre */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offreId?: number;

  /** Filtrer par statut email */
  @IsOptional()
  @IsIn(['pending', 'sent', 'failed'])
  emailStatus?: 'pending' | 'sent' | 'failed';

  /** Filtrer par plage de dates (ISO string) */
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  /** Tri */
  @IsOptional()
  @IsIn(['createdAt', 'nomPrenom', 'email', 'ville'])
  sortBy?: 'createdAt' | 'nomPrenom' | 'email' | 'ville' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}