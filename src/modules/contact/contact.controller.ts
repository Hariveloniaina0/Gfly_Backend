import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: CreateContactDto) {
    await this.contactService.sendContactEmail(dto);
    return { success: true, message: 'Message envoyé avec succès' };
  }
}