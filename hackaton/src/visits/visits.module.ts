import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController, AgendaController } from './visits.controller';
import { VisitNotificationsListener } from './listeners/visit-notifications.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [VisitsController, AgendaController],
  providers: [VisitsService, VisitNotificationsListener],
  exports: [VisitsService],
})
export class VisitsModule {}
