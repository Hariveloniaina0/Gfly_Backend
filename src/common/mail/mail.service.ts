// src/common/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Candidature } from '../../modules/candidatures/entities/candidature.entity';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // true pour 465
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendCandidatureNotification(candidature: Candidature): Promise<void> {
    const offreTitre = candidature.offre?.titre ?? `Offre #${candidature.offreId}`;
    const offreLieu = candidature.offre?.lieu ?? '—';
    const defaultRecipient = this.configService.get<string>('MAIL_DEFAULT_RECIPIENT');
    const recipientEmail = defaultRecipient || candidature.offre?.email;

    if (!recipientEmail) {
      this.logger.warn('Aucun destinataire configuré pour la candidature !');
      return; 
    }

    const attachments: nodemailer.SendMailOptions['attachments'] = [
      {
        filename: candidature.cvFilename,
        path: join(process.cwd(), 'uploads', 'candidatures', 'cv', candidature.cvPath),
      },
    ];

    if (candidature.lettrePath) {
      attachments.push({
        filename: candidature.lettreFilename,
        path: join(process.cwd(), 'uploads', 'candidatures', 'lettre', candidature.lettrePath),
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #673de6;">Nouvelle candidature reçue</h2>
        <hr style="border-color: #e2e8f0;" />

        <h3 style="color: #374151;">Poste : ${offreTitre}</h3>
        <p style="color: #6b7280;">📍 ${offreLieu}</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; color: #9ca3af; width: 140px;">Nom & Prénom</td>
              <td style="padding: 8px; color: #1f2937; font-weight: 600;">${candidature.nomPrenom}</td></tr>
          <tr style="background: #f9fafb;">
              <td style="padding: 8px; color: #9ca3af;">Email</td>
              <td style="padding: 8px; color: #1f2937;">${candidature.email}</td></tr>
          <tr><td style="padding: 8px; color: #9ca3af;">Téléphone</td>
              <td style="padding: 8px; color: #1f2937;">${candidature.telephone}</td></tr>
          <tr style="background: #f9fafb;">
              <td style="padding: 8px; color: #9ca3af;">Ville</td>
              <td style="padding: 8px; color: #1f2937;">${candidature.ville}</td></tr>
        </table>

        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          Les pièces jointes (CV${candidature.lettrePath ? ' + lettre de motivation' : ''}) sont attachées à cet email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Recrutement" <${this.configService.get('MAIL_USER')}>`,
        to: recipientEmail,
        subject: `[Candidature] ${candidature.nomPrenom} — ${offreTitre}`,
        html,
        attachments,
      });
      this.logger.log(`Email envoyé pour la candidature de ${candidature.nomPrenom}`);
    } catch (err) {
      // On log sans faire échouer la candidature
      this.logger.error(`Échec envoi email : ${err.message}`);
    }
  }
}