import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController, AgendaController } from './visits.controller';
import { VisitNotificationsListener } from './listeners/visit-notifications.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [VisitsController, AgendaController],
  providers: [VisitsService, VisitNotificationsListener],
  exports: [VisitsService],
})
export class VisitsModule {}
