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
import { VisitsService } from './visits.service';
import { CreateVisitDto, CheckInVisitDto, QueryVisitsDto, RejectVisitDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('visitas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * POST /visitas
   * Crear visita pre-autorizada
   * Solo AUTORIZANTE puede crear visitas
   */
  @Post()
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createVisit(
    @Body(ValidationPipe) createVisitDto: CreateVisitDto,
    @CurrentUser() user: any,
  ) {
    // El autorizante debe ser el usuario actual
    createVisitDto.autorizanteId = user.id;
    return this.visitsService.createVisit(createVisitDto);
  }

  /**
   * GET /visitas?autorizanteId=xxx
   * Obtener visitas por autorizante
   * Solo el propio autorizante puede ver sus visitas
   */
  @Get()
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  async getVisits(
    @Query(ValidationPipe) queryDto: QueryVisitsDto,
    @CurrentUser() user: any,
  ) {
    // Si es autorizante, solo puede ver sus propias visitas
    if (user.role === 'AUTORIZANTE') {
      return this.visitsService.getVisitsByAutorizante(user.id);
    }
    
    // Recepcionista y admin pueden filtrar por autorizante
    if (queryDto.autorizanteId) {
      return this.visitsService.getVisitsByAutorizante(queryDto.autorizanteId);
    }
    
    return [];
  }

  /**
   * GET /visitas/:id
   * Obtener una visita específica por ID
   */
  @Get(':id')
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  async getVisitById(@Param('id') id: string) {
    return this.visitsService.getVisitById(id);
  }

  /**
   * POST /visitas/:id/checkin
   * Marcar llegada de visita
   * Solo RECEPCIONISTA puede hacer check-in
   */
  @Post(':id/checkin')
  @Roles('RECEPCIONISTA', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async checkIn(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const checkInDto: CheckInVisitDto = {
      recepcionistaId: user.id,
    };
    return this.visitsService.markCheckIn(id, checkInDto);
  }

  /**
   * POST /visitas/:id/aprobar
   * Aprobar visita
   * Solo el AUTORIZANTE de la visita puede aprobar
   */
  @Post(':id/aprobar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveVisit(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // TODO: Verificar que el usuario sea el autorizante de la visita
    return this.visitsService.approveVisit(id);
  }

  /**
   * POST /visitas/:id/rechazar
   * Rechazar visita
   * Solo el AUTORIZANTE de la visita puede rechazar
   */
  @Post(':id/rechazar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async rejectVisit(
    @Param('id') id: string,
    @Body(ValidationPipe) rejectDto: RejectVisitDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Verificar que el usuario sea el autorizante de la visita
    return this.visitsService.rejectVisit(id, rejectDto);
  }
}

/**
 * Controlador para endpoints de agenda/recepción
 */
@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * GET /agenda/visitas
   * Listado diario para recepción
   * Solo RECEPCIONISTA puede ver la agenda
   */
  @Get('visitas')
  @Roles('RECEPCIONISTA', 'ADMIN')
  async getDailyVisits(@Query(ValidationPipe) queryDto: QueryVisitsDto) {
    return this.visitsService.getDailyVisits(queryDto);
  }
}
