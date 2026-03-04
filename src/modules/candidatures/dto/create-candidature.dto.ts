import { Type } from 'class-transformer';
import {
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
} from 'class-validator';

export class CreateCandidatureDto {
    @IsString()
    @IsNotEmpty({ message: 'Le nom et prénom sont requis' })
    nomPrenom: string;

    @IsString()
    @IsNotEmpty({ message: 'La ville est requise' })
    ville: string;

    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @IsString()
    @Matches(/^[+0-9\s\-().]{7,20}$/, { message: 'Numéro de téléphone invalide' })
    telephone: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    offreId?: number;
}