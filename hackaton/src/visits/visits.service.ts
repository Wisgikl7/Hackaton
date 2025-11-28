import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVisitDto,
  CheckInVisitDto,
  QueryVisitsDto,
  RejectVisitDto,
  AceptVisitPendingDto,
} from './dto';
import {
  VisitCheckInEvent,
  VisitApprovedEvent,
  VisitRejectedEvent,
  VisitPendingEvent,
  VisitPendingApprovedEvent,
} from './events';
import { VisitStatus } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createVisit(createVisitDto: CreateVisitDto) {
    const autorizante = await this.prisma.user.findUnique({
      where: { id: createVisitDto.autorizanteId },
    });
    let recepcionista = null;

    if (!autorizante) {
      throw new NotFoundException('Autorizante no encontrado');
    }

    let fechaHoraLlegada = null;

    if (createVisitDto.recepcionistaId != null) {
      recepcionista = await this.prisma.user.findUnique({
        where: { id: createVisitDto.recepcionistaId },
      });

      if (!recepcionista) {
        throw new NotFoundException('Recepcionista no encontrado');
      }

      fechaHoraLlegada = new Date();
    }

    const estado =
      createVisitDto.recepcionistaId == null
        ? VisitStatus.PRE_AUTORIZADA
        : VisitStatus.PENDIENTE_VALIDACION;

    const visit = await this.prisma.visit.create({
      data: {
        nombreVisitante: createVisitDto.nombreVisitante,
        dniVisitante: createVisitDto.dniVisitante,
        empresa: createVisitDto.empresa,
        motivo: createVisitDto.motivo,
        fechaHoraEstimada: new Date(createVisitDto.fechaHoraEstimada),
        fechaHoraLlegada: fechaHoraLlegada,
        autorizanteId: createVisitDto.autorizanteId,
        recepcionistaId: createVisitDto.recepcionistaId,
        estado: estado,
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (estado == VisitStatus.PENDIENTE_VALIDACION) {
      this.eventEmitter.emit(
        'visit.pending',
        new VisitPendingEvent(
          visit.id,
          visit.autorizanteId,
          visit.autorizante.email,
          visit.autorizante.name,
          visit.nombreVisitante,
          fechaHoraLlegada,
          visit.recepcionistaId,
          recepcionista.name,
        ),
      );
    }

    return visit;
  }

  async getVisitsByAutorizante(autorizanteId: string) {
    return this.prisma.visit.findMany({
      where: {
        autorizanteId,
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        fechaHoraEstimada: 'desc',
      },
    });
  }

  async getDailyVisits(queryDto: QueryVisitsDto) {
    const today = queryDto.fecha ? new Date(queryDto.fecha) : new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const where: any = {
      fechaHoraEstimada: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (queryDto.estado) {
      const estados = queryDto.estado.split(',').map((e) => e.trim());
      where.estado = {
        in: estados,
      };
    } else {
      where.estado = {
        in: ['PRE_AUTORIZADA', 'EN_RECEPCION'],
      };
    }

    return this.prisma.visit.findMany({
      where,
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        fechaHoraEstimada: 'asc',
      },
    });
  }

  async markCheckIn(visitId: string, checkInDto: CheckInVisitDto) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        autorizante: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    if (visit.estado !== 'PRE_AUTORIZADA') {
      throw new BadRequestException(
        `No se puede hacer check-in. Estado actual: ${visit.estado}`,
      );
    }

    const fechaHoraLlegada = new Date();

    const updatedVisit = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        estado: 'EN_RECEPCION',
        fechaHoraLlegada,
        recepcionistaId: checkInDto.recepcionistaId,
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.eventEmitter.emit(
      'visit.checkin',
      new VisitCheckInEvent(
        updatedVisit.id,
        updatedVisit.autorizanteId,
        updatedVisit.autorizante.email,
        updatedVisit.autorizante.name,
        updatedVisit.nombreVisitante,
        fechaHoraLlegada,
      ),
    );

    return updatedVisit;
  }

  async approveVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        autorizante: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    if (visit.estado !== 'EN_RECEPCION') {
      throw new BadRequestException(
        `No se puede aprobar. Estado actual: ${visit.estado}`,
      );
    }

    const updatedVisit = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        estado: 'APROBADA',
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.eventEmitter.emit(
      'visit.approved',
      new VisitApprovedEvent(
        updatedVisit.id,
        updatedVisit.autorizanteId,
        updatedVisit.nombreVisitante,
      ),
    );

    return updatedVisit;
  }

  async rejectVisit(visitId: string, rejectDto: RejectVisitDto) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        autorizante: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    if (visit.estado !== 'EN_RECEPCION') {
      throw new BadRequestException(
        `No se puede rechazar. Estado actual: ${visit.estado}`,
      );
    }

    const updatedVisit = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        estado: 'RECHAZADA',
        razonRechazo: rejectDto.razon,
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.eventEmitter.emit(
      'visit.rejected',
      new VisitRejectedEvent(
        updatedVisit.id,
        updatedVisit.autorizanteId,
        updatedVisit.autorizante.name,
        updatedVisit.autorizante.email,
        updatedVisit.nombreVisitante,
        rejectDto.razon,
        updatedVisit.recepcionistaId,
      ),
    );

    return updatedVisit;
  }

  async getVisitById(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    return visit;
  }

  async validarVisitaPendiente(
    visitId: string,
    aceptPendingDto: AceptVisitPendingDto,
  ) {
    const visit = await this.getVisitById(visitId);

    if (visit.estado !== 'PENDIENTE_VALIDACION') {
      throw new BadRequestException(
        `No se puede validar. Estado actual: ${visit.estado}`,
      );
    }

    const updatedVisit = await this.prisma.visit.update({
      where: { id: visit.id },
      data: {
        estado: VisitStatus.EN_RECEPCION,
      },
      include: {
        autorizante: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!aceptPendingDto.aceptar) {
      let rechazo = new RejectVisitDto();
      rechazo.razon = aceptPendingDto.razon;
      await this.rejectVisit(visitId, rechazo);
    } else {
      if (updatedVisit.recepcionistaId) {
        this.eventEmitter.emit(
          'visit.pending.approved',
          new VisitPendingApprovedEvent(
            updatedVisit.id,
            updatedVisit.recepcionistaId,
            updatedVisit.nombreVisitante,
            updatedVisit.autorizante.name,
          ),
        );
      }
    }
  }
}
