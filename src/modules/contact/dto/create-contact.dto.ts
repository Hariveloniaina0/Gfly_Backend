import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le sujet est requis' })
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Le message est requis' })
  @MinLength(10, { message: 'Message trop court (min 10 caractères)' })
  @MaxLength(5000)
  message: string;
}