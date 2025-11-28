import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPassword = this.configService.get<string>('MAIL_PASSWORD');

    if (mailUser && mailPassword) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
        port: this.configService.get<number>('MAIL_PORT', 587),
        secure: false,
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
      });
      this.logger.log('✅ Servicio de email configurado correctamente');
    } else {
      this.logger.warn(
        '⚠️  Credenciales de email no configuradas. Usando cuenta de prueba de Ethereal...',
      );
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log('✅ Cuenta de prueba Ethereal creada automáticamente');
      this.logger.log(`📧 Usuario: ${testAccount.user}`);
      this.logger.log(
        '🔗 Los emails se pueden ver en: https://ethereal.email/messages',
      );
    } catch (error) {
      this.logger.error(
        '❌ No se pudo crear cuenta de prueba de Ethereal',
        error.message,
      );
    }
  }

  async sendCheckInNotification(
    autorizanteEmail: string,
    autorizanteName: string,
    nombreVisitante: string,
    fechaHoraLlegada: Date,
    visitaId: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `📧 [SIMULADO] Email de check-in a ${autorizanteEmail} (${autorizanteName}) para visitante ${nombreVisitante}`,
      );
      return;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@visitas.com',
        ),
        to: autorizanteEmail,
        subject: '🔔 Visitante en Recepción - Requiere Aprobación',
        html: this.getCheckInEmailTemplate(
          autorizanteName,
          nombreVisitante,
          fechaHoraLlegada,
          visitaId,
        ),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de check-in enviado a ${autorizanteEmail}`);

      const previewUrl = nodemailer.getTestMessageUrl(mailOptions as any);
      if (previewUrl) {
        this.logger.log(`🔗 Ver email en: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error al enviar email a ${autorizanteEmail}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getCheckInEmailTemplate(
    autorizanteName: string,
    nombreVisitante: string,
    fechaHoraLlegada: Date,
    visitaId: string,
  ): string {
    const horaLlegada = fechaHoraLlegada.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const fechaLlegada = fechaHoraLlegada.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const logoUrl = this.configService.get<string>(
      'MAIL_LOGO_URL',
      'https://politicacordobaverdad.com.ar/wp-content/uploads/2025/03/logo-loteria-de-cordoba.jpg',
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 150px;
            height: auto;
            border-radius: 8px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-box {
            background-color: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 15px 0;
          }
          .info-label {
            font-weight: bold;
            color: #2e7d32;
          }
          .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
            font-weight: bold;
          }
          .button-reject {
            background-color: #f44336;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="${logoUrl}" alt="Logo Sistema de Visitas" />
          </div>
          
          <div class="header">
            <h1>🔔 Visitante en Recepción</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${autorizanteName}</strong>,</p>
            
            <p>Te informamos que tu visitante ha llegado y está esperando en recepción:</p>
            
            <div class="info-box">
              <p><span class="info-label">👤 Visitante:</span> ${nombreVisitante}</p>
              <p><span class="info-label">🕐 Hora de llegada:</span> ${horaLlegada}</p>
              <p><span class="info-label">📅 Fecha:</span> ${fechaLlegada}</p>
              <p><span class="info-label">🆔 ID de Visita:</span> ${visitaId}</p>
            </div>
            
            <p><strong>⚠️ Acción requerida:</strong></p>
            <p>Por favor, aprueba o rechaza esta visita lo antes posible.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/visitas/${visitaId}/aprobar" class="button">
                ✅ Aprobar Visita
              </a>
              <a href="${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/visitas/${visitaId}/rechazar" class="button button-reject">
                ❌ Rechazar Visita
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Visitas.</p>
            <p>Por favor, no respondas a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPendingNotification(
    autorizanteEmail: string,
    autorizanteName: string,
    nombreVisitante: string,
    fechaHoraLlegada: Date,
    visitaId: string,
    recepcionistaName: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `📧 [SIMULADO] Email de visita pendiente de validar a ${autorizanteEmail} (${autorizanteName}) para visitante ${nombreVisitante}`,
      );
      return;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@visitas.com',
        ),
        to: autorizanteEmail,
        subject: '🔔 Visitante en Recepción - Requiere Validación',
        html: this.getPendingEmailTemplate(
          autorizanteName,
          nombreVisitante,
          fechaHoraLlegada,
          visitaId,
          recepcionistaName
        ),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de validación enviado a ${autorizanteEmail}`);

      const previewUrl = nodemailer.getTestMessageUrl(mailOptions as any);
      if (previewUrl) {
        this.logger.log(`🔗 Ver email en: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error al enviar email a ${autorizanteEmail}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getPendingEmailTemplate(
    autorizanteName: string,
    nombreVisitante: string,
    fechaHoraLlegada: Date,
    visitaId: string,
    recepcionistaName: string,
  ): string {
    const horaLlegada = fechaHoraLlegada.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const fechaLlegada = fechaHoraLlegada.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const logoUrl = this.configService.get<string>(
      'MAIL_LOGO_URL',
      'https://politicacordobaverdad.com.ar/wp-content/uploads/2025/03/logo-loteria-de-cordoba.jpg',
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 150px;
            height: auto;
            border-radius: 8px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-box {
            background-color: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 15px 0;
          }
          .info-label {
            font-weight: bold;
            color: #2e7d32;
          }
          .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
            font-weight: bold;
          }
          .button-reject {
            background-color: #f44336;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="${logoUrl}" alt="Logo Sistema de Visitas" />
          </div>
          
          <div class="header">
            <h1>🔔 Visitante en Recepción</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${autorizanteName}</strong>,</p>
            
            <p>El recepcionista ${recepcionistaName} informa que un visitante ha llegado sin previa autorización y está esperando en recepción:</p>
            
            <div class="info-box">
              <p><span class="info-label">👤 Visitante:</span> ${nombreVisitante}</p>
              <p><span class="info-label">🕐 Hora de llegada:</span> ${horaLlegada}</p>
              <p><span class="info-label">📅 Fecha:</span> ${fechaLlegada}</p>
              <p><span class="info-label">🆔 ID de Visita:</span> ${visitaId}</p>
            </div>
            
            <p><strong>⚠️ Acción requerida:</strong></p>
            <p>Por favor, aprueba o rechaza esta visita lo antes posible.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/visitas/${visitaId}/aprobar" class="button">
                ✅ Aprobar Visita
              </a>
              <a href="${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/visitas/${visitaId}/rechazar" class="button button-reject">
                ❌ Rechazar Visita
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Visitas.</p>
            <p>Por favor, no respondas a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendApprovedNotification(
    autorizanteEmail: string,
    nombreVisitante: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@visitas.com',
        ),
        to: autorizanteEmail,
        subject: '✅ Visita Aprobada',
        html: `
          <h2>Visita Aprobada</h2>
          <p>La visita de <strong>${nombreVisitante}</strong> ha sido aprobada.</p>
          <p>El visitante puede ingresar a las instalaciones.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de aprobación enviado a ${autorizanteEmail}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar email de aprobación: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendRejectedNotification(
    autorizanteEmail: string,
    nombreVisitante: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@visitas.com',
        ),
        to: autorizanteEmail,
        subject: '❌ Visita Rechazada',
        html: `
          <h2>Visita Rechazada</h2>
          <p>La visita de <strong>${nombreVisitante}</strong> ha sido rechazada.</p>
          <p>El visitante no podrá ingresar a las instalaciones.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de rechazo enviado a ${autorizanteEmail}`);
    } catch (error) {
      this.logger.error(
        `Error al enviar email de rechazo: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendRejectionToReceptionist(
    recepcionistaId: string,
    nombreVisitante: string,
    autorizanteName: string,
    razon: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `📧 [SIMULADO] Email de rechazo al recepcionista para visitante ${nombreVisitante}`,
      );
      return;
    }

    try {
      const recepcionista = await this.prisma.user.findUnique({
        where: { id: recepcionistaId },
        select: { email: true, name: true },
      });

      if (!recepcionista) {
        this.logger.warn(
          `⚠️  No se encontró el recepcionista con ID: ${recepcionistaId}`,
        );
        return;
      }

      const logoUrl = this.configService.get<string>(
        'MAIL_LOGO_URL',
        'https://files.slack.com/files-pri/T072FJCSQMS-F0A0CFBP11C/loticon.jpg',
      );

      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          'noreply@visitas.com',
        ),
        to: recepcionista.email,
        subject: '❌ Visita Rechazada por Autorizante',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                border: 1px solid #e0e0e0;
              }
              .logo {
                text-align: center;
                margin-bottom: 20px;
              }
              .logo img {
                max-width: 150px;
                height: auto;
                border-radius: 8px;
              }
              .header {
                background-color: #f44336;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .info-box {
                background-color: #ffebee;
                border-left: 4px solid #f44336;
                padding: 15px;
                margin: 15px 0;
              }
              .info-label {
                font-weight: bold;
                color: #c62828;
              }
              .reason-box {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="${logoUrl}" alt="Logo Sistema de Visitas" />
              </div>
              
              <div class="header">
                <h1>❌ Visita Rechazada</h1>
              </div>
              
              <div class="content">
                <p>Hola <strong>${recepcionista.name}</strong>,</p>
                
                <p>Te informamos que la siguiente visita ha sido <strong>rechazada</strong> por el autorizante:</p>
                
                <div class="info-box">
                  <p><span class="info-label">👤 Visitante:</span> ${nombreVisitante}</p>
                  <p><span class="info-label">🙅 Rechazado por:</span> ${autorizanteName}</p>
                </div>
                
                <div class="reason-box">
                  <p><strong>📝 Razón del rechazo:</strong></p>
                  <p>${razon}</p>
                </div>
                
                <p><strong>⚠️ Acción requerida:</strong></p>
                <p>Por favor, informa al visitante que no podrá ingresar a las instalaciones.</p>
              </div>
              
              <div class="footer">
                <p>Este es un mensaje automático del Sistema de Gestión de Visitas.</p>
                <p>Por favor, no respondas a este correo.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `✅ Email de rechazo enviado al recepcionista ${recepcionista.email}`,
      );

      const previewUrl = nodemailer.getTestMessageUrl(mailOptions as any);
      if (previewUrl) {
        this.logger.log(`🔗 Ver email en: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error al enviar email al recepcionista: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
