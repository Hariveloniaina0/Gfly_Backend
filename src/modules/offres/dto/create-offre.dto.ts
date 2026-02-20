import { IsString, IsEmail, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateOffreDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  titre: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty({ message: 'La description est requise' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Le lieu est requis' })
  lieu: string;

  @IsString()
  @IsNotEmpty({ message: 'Le type de contrat est requis' })
  typeContrat: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsDateString({}, { message: 'Date de publication invalide' })
  datePublication: string;
}