import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { QueryLogsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('activity-log')
@ApiBearerAuth('JWT-auth')
@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Obtener logs de actividad',
    description: 'Consulta el historial de actividades con filtros opcionales. Solo accesible para ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de actividad',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '123e4567-e89b-12d3-a456-426614174001',
            action: 'GET_VISITS',
            endpoint: '/api/visitas',
            method: 'GET',
            statusCode: 200,
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            description: 'Consulta de visitas',
            metadata: { filters: { estado: 'APROBADA' } },
            createdAt: '2025-11-28T10:00:00Z',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Juan Pérez',
              email: 'juan@ejemplo.com',
              role: 'AUTORIZANTE',
            },
          },
        ],
        total: 150,
        limit: 100,
        offset: 0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo ADMIN',
  })
  async getLogs(@Query(ValidationPipe) queryDto: QueryLogsDto) {
    const filters = {
      userId: queryDto.userId,
      action: queryDto.action,
      endpoint: queryDto.endpoint,
      startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      limit: queryDto.limit,
      offset: queryDto.offset,
    };

    return this.activityLogService.getLogs(filters);
  }

  @Get('my-logs')
  @Roles('AUTORIZANTE', 'RECEPCIONISTA', 'ADMIN')
  @ApiOperation({
    summary: 'Obtener mis logs de actividad',
    description: 'Consulta el historial de actividades del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs del usuario',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          action: 'GET_VISITS',
          endpoint: '/api/visitas',
          method: 'GET',
          statusCode: 200,
          ip: '192.168.1.100',
          createdAt: '2025-11-28T10:00:00Z',
        },
      ],
    },
  })
  async getMyLogs(@CurrentUser() user: any) {
    return this.activityLogService.getUserLogs(user.id);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Obtener estadísticas de actividad',
    description: 'Consulta estadísticas generales de actividad del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de actividad',
    schema: {
      example: {
        totalLogs: 1500,
        logsByAction: [
          { action: 'GET_VISITS', _count: { id: 450 } },
          { action: 'CREATE_VISIT', _count: { id: 300 } },
          { action: 'LOGIN', _count: { id: 200 } },
        ],
        logsByEndpoint: [
          { endpoint: '/api/visitas', _count: { id: 500 } },
          { endpoint: '/api/auth/login', _count: { id: 200 } },
        ],
        recentActivity: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            action: 'GET_VISITS',
            endpoint: '/api/visitas',
            method: 'GET',
            statusCode: 200,
            createdAt: '2025-11-28T10:00:00Z',
            user: {
              name: 'Juan Pérez',
              email: 'juan@ejemplo.com',
            },
          },
        ],
      },
    },
  })
  async getStats(@Query('userId') userId?: string) {
    return this.activityLogService.getActivityStats(userId);
  }
}
