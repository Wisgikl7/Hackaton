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

@Controller('visitas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly userService : AuthService,
  ) {}

  @Post()
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createVisit(
    @Body(ValidationPipe) createVisitDto: CreateVisitDto,
    @CurrentUser() user: any,
  ) {
    const userData = await this.userService.validateUser(user.id);
    if (userData.role == "AUTORIZANTE")
    {
      createVisitDto.autorizanteId = user.id;
    }
    else if (userData.role == "RECEPCIONISTA")
    {
      createVisitDto.recepcionistaId = user.id;
    }
    return this.visitsService.createVisit(createVisitDto);
  }

  @Get()
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
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
  async getVisitById(@Param('id') id: string) {
    return this.visitsService.getVisitById(id);
  }

  @Post(':id/checkin')
  @Roles('RECEPCIONISTA', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async checkIn(@Param('id') id: string, @CurrentUser() user: any) {
    const checkInDto: CheckInVisitDto = {
      recepcionistaId: user.id,
    };
    return this.visitsService.markCheckIn(id, checkInDto);
  }

  @Post(':id/aprobar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveVisit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitsService.approveVisit(id);
  }

  @Post(':id/rechazar')
  @Roles('AUTORIZANTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
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
  async validarVisitaPendiente(
    @Param('id') id: string,
    @Body(ValidationPipe) aceptPending: AceptVisitPendingDto,
    @CurrentUser() user: any,
  ) {
    return this.visitsService.validarVisitaPendiente(id, aceptPending);
  }
}

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('visitas')
  @Roles('RECEPCIONISTA', 'ADMIN')
  async getDailyVisits(@Query(ValidationPipe) queryDto: QueryVisitsDto) {
    return this.visitsService.getDailyVisits(queryDto);
  }
}
