import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryVisitsDto {
  @ApiPropertyOptional({
    description: 'ID del autorizante para filtrar visitas (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  autorizanteId?: string;

  @ApiPropertyOptional({
    description: 'Fecha para filtrar visitas (formato ISO 8601)',
    example: '2025-11-28',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Estado de la visita',
    enum: ['PRE_AUTORIZADA', 'EN_RECEPCION', 'APROBADA', 'RECHAZADA'],
    example: 'APROBADA',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PRE_AUTORIZADA', 'EN_RECEPCION', 'APROBADA', 'RECHAZADA'])
  estado?: string;
}
