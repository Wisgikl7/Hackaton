import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  VisitCheckInEvent,
  VisitApprovedEvent,
  VisitRejectedEvent,
} from '../events';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class VisitNotificationsListener {
  private readonly logger = new Logger(VisitNotificationsListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('visit.checkin')
  async handleVisitCheckIn(event: VisitCheckInEvent) {
    this.logger.log(`[CHECK-IN] Visitante ${event.nombreVisitante} ha llegado`);
    this.logger.log(`Visita ID: ${event.visitaId}`);
    this.logger.log(
      `Autorizante: ${event.autorizanteName} (${event.autorizanteEmail})`,
    );
    this.logger.log(`Hora de llegada: ${event.fechaHoraLlegada.toISOString()}`);

    try {
      // Enviar email inmediato al autorizante
      await this.mailService.sendCheckInNotification(
        event.autorizanteEmail,
        event.autorizanteName,
        event.nombreVisitante,
        event.fechaHoraLlegada,
        event.visitaId,
      );
      this.logger.log(
        `✅ Email de check-in enviado exitosamente a ${event.autorizanteEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al enviar email de check-in: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('visit.approved')
  async handleVisitApproved(event: VisitApprovedEvent) {
    this.logger.log(`[APROBADA] Visita de ${event.nombreVisitante} aprobada`);
    this.logger.log(`Visita ID: ${event.visitaId}`);
    this.logger.log(`Autorizante ID: ${event.autorizanteId}`);

    await this.simulateNotificationSending(event);
  }

  @OnEvent('visit.rejected')
  async handleVisitRejected(event: VisitRejectedEvent) {
    this.logger.log(`[RECHAZADA] Visita de ${event.nombreVisitante} rechazada`);
    this.logger.log(`Visita ID: ${event.visitaId}`);
    this.logger.log(`Autorizante: ${event.autorizanteName}`);
    this.logger.log(`Razón: ${event.razon}`);

    if (event.recepcionistaId) {
      try {
        await this.mailService.sendRejectionToReceptionist(
          event.recepcionistaId,
          event.nombreVisitante,
          event.autorizanteName,
          event.razon,
        );
        this.logger.log(`✅ Email de rechazo enviado al recepcionista`);
      } catch (error) {
        this.logger.error(
          `❌ Error al enviar email de rechazo: ${error.message}`,
          error.stack,
        );
      }
    } else {
      this.logger.warn('⚠️  No hay recepcionista asignado, no se envió email');
    }
  }

  private async simulateNotificationSending(event: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.logger.debug('Notificación enviada exitosamente');
        resolve();
      }, 100);
    });
  }
}
