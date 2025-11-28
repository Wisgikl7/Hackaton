import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto, CheckInVisitDto, QueryVisitsDto } from './dto';
import {
  VisitCheckInEvent,
  VisitApprovedEvent,
  VisitRejectedEvent,
} from './events';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * RF-BE 1 – Crear visita pre-autorizada
   */
  async createVisit(createVisitDto: CreateVisitDto) {
    // Verificar que el autorizante existe
    const autorizante = await this.prisma.user.findUnique({
      where: { id: createVisitDto.autorizanteId },
    });

    if (!autorizante) {
      throw new NotFoundException('Autorizante no encontrado');
    }

    const visit = await this.prisma.visit.create({
      data: {
        nombreVisitante: createVisitDto.nombreVisitante,
        dniVisitante: createVisitDto.dniVisitante,
        empresa: createVisitDto.empresa,
        motivo: createVisitDto.motivo,
        fechaHoraEstimada: new Date(createVisitDto.fechaHoraEstimada),
        autorizanteId: createVisitDto.autorizanteId,
        estado: 'PRE_AUTORIZADA',
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

    return visit;
  }

  /**
   * RF-BE 2 – Consultar estado de visita por autorizante
   */
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

  /**
   * RF-BE 3 – Listado diario para Recepción
   */
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

    // Filtrar por estados si se proporciona
    if (queryDto.estado) {
      const estados = queryDto.estado.split(',').map((e) => e.trim());
      where.estado = {
        in: estados,
      };
    } else {
      // Por defecto, mostrar PRE_AUTORIZADA y EN_RECEPCION
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

  /**
   * RF-BE 4 – Check-in rápido
   * RF-BE 5 – Notificación inmediata (mediante eventos)
   */
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

    // Emitir evento para notificaciones
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

  /**
   * RF-BE 6 – Aprobación
   */
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

    // Emitir evento
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

  /**
   * RF-BE 6 – Rechazo
   */
  async rejectVisit(visitId: string) {
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

    // Emitir evento
    this.eventEmitter.emit(
      'visit.rejected',
      new VisitRejectedEvent(
        updatedVisit.id,
        updatedVisit.autorizanteId,
        updatedVisit.nombreVisitante,
      ),
    );

    return updatedVisit;
  }

  /**
   * Obtener una visita por ID
   */
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
}
