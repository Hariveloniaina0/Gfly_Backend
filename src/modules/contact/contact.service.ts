import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendContactEmail(dto: CreateContactDto): Promise<void> {
    const recipient = this.configService.get<string>('MAIL_CONTACT_RECIPIENT');
    const mailUser  = this.configService.get<string>('MAIL_USER');

    // ── Email à l'équipe G-Fly ────────────────────────────────────────────
    const htmlToTeam = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">

        <div style="background: linear-gradient(135deg, #673de6, #9f9ff7); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">📬 Nouveau message de contact</h2>
          <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">Via le formulaire G-Fly.fr</p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 32px;">

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #9ca3af; font-size: 13px; width: 120px; vertical-align: top;">Nom</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${dto.name}</td>
            </tr>
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #9ca3af; font-size: 13px; vertical-align: top;">Email</td>
              <td style="padding: 10px 0;">
                <a href="mailto:${dto.email}" style="color: #673de6; text-decoration: none; font-weight: 500;">${dto.email}</a>
              </td>
            </tr>
            <tr style="border-top: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; color: #9ca3af; font-size: 13px; vertical-align: top;">Sujet</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 500;">${dto.subject}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 16px 20px; background: #f9fafb; border-left: 3px solid #673de6; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Message</p>
            <p style="margin: 0; color: #374151; line-height: 1.7; white-space: pre-wrap;">${dto.message}</p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="mailto:${dto.email}?subject=Re: ${encodeURIComponent(dto.subject)}"
               style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #673de6, #9f9ff7); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Répondre à ${dto.name}
            </a>
          </div>

          <p style="margin-top: 24px; font-size: 11px; color: #d1d5db; text-align: center;">
            Message reçu depuis le formulaire de contact G-Fly.fr
          </p>
        </div>
      </div>
    `;

    // ── Email de confirmation au visiteur ─────────────────────────────────
    const htmlToVisitor = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">

        <div style="background: linear-gradient(135deg, #673de6, #9f9ff7); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">G-Fly — Message bien reçu ✓</h2>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 32px;">
          <p style="color: #374151; line-height: 1.7; margin-top: 0;">
            Bonjour <strong>${dto.name}</strong>,
          </p>
          <p style="color: #374151; line-height: 1.7;">
            Merci pour votre message. Nous l'avons bien reçu et nous vous répondrons dans les plus brefs délais (généralement sous 24-48h ouvrées).
          </p>

          <div style="margin: 20px 0; padding: 16px 20px; background: #f9fafb; border-left: 3px solid #673de6; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 6px; color: #9ca3af; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Votre message</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;"><strong>Sujet :</strong> ${dto.subject}</p>
            <p style="margin: 8px 0 0; color: #374151; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${dto.message}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.7;">
            À très bientôt,<br/>
            <strong style="color: #673de6;">L'équipe G-Fly</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
          <p style="font-size: 11px; color: #d1d5db; text-align: center; margin: 0;">
            📞 La Réunion : +262 692 59 17 21 &nbsp;|&nbsp; Madagascar : +261 34 35 408 69
          </p>
        </div>
      </div>
    `;

    await Promise.allSettled([
      this.transporter.sendMail({
        from: `"G-Fly Contact" <${mailUser}>`,
        to: recipient,
        replyTo: dto.email,          
        subject: `[Contact] ${dto.name} — ${dto.subject}`,
        html: htmlToTeam,
      }),

      this.transporter.sendMail({
        from: `"G-Fly" <${mailUser}>`,
        to: dto.email,
        subject: `G-Fly — Votre message a bien été reçu`,
        html: htmlToVisitor,
      }),
    ]).then((results) => {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          this.logger.error(`Erreur envoi email #${i + 1} : ${result.reason}`);
        }
      });
      this.logger.log(`Emails de contact envoyés pour ${dto.name} <${dto.email}>`);
    });
  }
}