import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateVisitDto,
  CheckInVisitDto,
  QueryVisitsDto,
  RejectVisitDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AceptVisitPendingDto } from './dto/acept-visit-pending.dto';

@ApiTags('visitas')
@ApiBearerAuth('JWT-auth')
@Controller('visitas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly userService: AuthService,
  ) {}

  @Post()
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva visita',
    description:
      'Registra una nueva visita en el sistema. El autorizante o recepcionista se asigna automáticamente según el rol del usuario.',
  })
  @ApiBody({ type: CreateVisitDto })
  @ApiResponse({
    status: 201,
    description: 'Visita creada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nombreVisitante: 'Carlos García',
        dniVisitante: '12345678',
        empresa: 'Tech Solutions S.A.',
        motivo: 'Reunión con el equipo de desarrollo',
        fechaHoraEstimada: '2025-11-28T14:30:00Z',
        estado: 'PRE_AUTORIZADA',
        autorizanteId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: '2025-11-28T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente',
  })
  async createVisit(
    @Body(ValidationPipe) createVisitDto: CreateVisitDto,
    @CurrentUser() user: any,
  ) {
    const userData = await this.userService.validateUser(user.id);
    if (userData.role == 'AUTORIZANTE') {
      createVisitDto.autorizanteId = user.id;
    } else if (userData.role == 'RECEPCIONISTA') {
      createVisitDto.recepcionistaId = user.id;
    }
    return this.visitsService.createVisit(createVisitDto);
  }

  @Get()
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  @ApiOperation({
    summary: 'Listar visitas',
    description:
      'Obtiene la lista de visitas. Si el usuario es AUTORIZANTE, solo ve sus propias visitas. Si tiene rol ADMIN o RECEPCIONISTA, puede filtrar por autorizanteId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de visitas obtenida exitosamente',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombreVisitante: 'Carlos García',
          dniVisitante: '12345678',
          empresa: 'Tech Solutions S.A.',
          motivo: 'Reunión con el equipo de desarrollo',
          fechaHoraEstimada: '2025-11-28T14:30:00Z',
          estado: 'APROBADA',
          autorizanteId: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: '2025-11-28T10:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getVisits(
    @Query(ValidationPipe) queryDto: QueryVisitsDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === 'AUTORIZANTE') {
      return this.visitsService.getVisitsByAutorizante(user.id);
    }

    if (queryDto.autorizanteId) {
      return this.visitsService.getVisitsByAutorizante(queryDto.autorizanteId);
    }

    return [];
  }

  @Get(':id')
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  @ApiOperation({
    summary: 'Obtener visita por ID',
    description: 'Consulta los detalles de una visita específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Visita encontrada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nombreVisitante: 'Carlos García',
        dniVisitante: '12345678',
        empresa: 'Tech Solutions S.A.',
        motivo: 'Reunión con el equipo de desarrollo',
        fechaHoraEstimada: '2025-11-28T14:30:00Z',
        estado: 'APROBADA',
        autorizanteId: '123e4567-e89b-12d3-a456-426614174001',
        autorizante: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'María López',
          email: 'maria@ejemplo.com',
        },
        createdAt: '2025-11-28T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Visita no encontrada',
  })
  async getVisitById(@Param('id') id: string) {
    return this.visitsService.getVisitById(id);
  }

  @Post(':id/checkin')
  @Roles('RECEPCIONISTA', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar check-in de visita',
    description: 'Marca el ingreso de un visitante en recepción',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in registrado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'EN_RECEPCION',
        fechaHoraCheckin: '2025-11-28T14:25:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Visita no encontrada',
  })
  async checkIn(@Param('id') id: string, @CurrentUser() user: any) {
    const checkInDto: CheckInVisitDto = {
      recepcionistaId: user.id,
    };
    return this.visitsService.markCheckIn(id, checkInDto);
  }

  @Post(':id/aprobar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar visita',
    description: 'El autorizante aprueba la visita solicitada',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Visita aprobada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'APROBADA',
        fechaHoraAprobacion: '2025-11-28T11:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Visita no encontrada',
  })
  async approveVisit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitsService.approveVisit(id);
  }

  @Post(':id/rechazar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar visita',
    description: 'El autorizante rechaza la visita con una razón',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: RejectVisitDto })
  @ApiResponse({
    status: 200,
    description: 'Visita rechazada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'RECHAZADA',
        razonRechazo: 'El autorizante no se encuentra disponible',
        fechaHoraRechazo: '2025-11-28T11:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Visita no encontrada',
  })
  async rejectVisit(
    @Param('id') id: string,
    @Body(ValidationPipe) rejectDto: RejectVisitDto,
    @CurrentUser() user: any,
  ) {
    return this.visitsService.rejectVisit(id, rejectDto);
  }

  @Post(':id/validarVisitaPendiente')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar visita pendiente',
    description:
      'El autorizante valida una visita que está en estado pendiente de validación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la visita (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: AceptVisitPendingDto })
  @ApiResponse({
    status: 200,
    description: 'Visita pendiente validada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        estado: 'APROBADA',
        razon: 'Se aprueba con restricción de área',
        fechaHoraValidacion: '2025-11-28T11:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Visita no encontrada',
  })
  async validarVisitaPendiente(
    @Param('id') id: string,
    @Body(ValidationPipe) aceptPending: AceptVisitPendingDto,
    @CurrentUser() user: any,
  ) {
    return this.visitsService.validarVisitaPendiente(id, aceptPending);
  }
}

@ApiTags('agenda')
@ApiBearerAuth('JWT-auth')
@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('visitas')
  @Roles('RECEPCIONISTA', 'ADMIN')
  @ApiOperation({
    summary: 'Obtener agenda de visitas diarias',
    description:
      'Consulta las visitas programadas del día actual o filtradas por parámetros',
  })
  @ApiResponse({
    status: 200,
    description: 'Agenda de visitas obtenida exitosamente',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nombreVisitante: 'Carlos García',
          dniVisitante: '12345678',
          empresa: 'Tech Solutions S.A.',
          fechaHoraEstimada: '2025-11-28T14:30:00Z',
          estado: 'APROBADA',
          autorizante: {
            name: 'María López',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getDailyVisits(@Query(ValidationPipe) queryDto: QueryVisitsDto) {
    return this.visitsService.getDailyVisits(queryDto);
  }
}
