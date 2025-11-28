import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty({
    description: 'Nombre completo del visitante',
    example: 'Carlos García',
  })
  @IsString()
  @IsNotEmpty()
  nombreVisitante: string;

  @ApiProperty({
    description: 'DNI o documento de identidad del visitante',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  dniVisitante: string;

  @ApiProperty({
    description: 'Empresa u organización del visitante',
    example: 'Tech Solutions S.A.',
  })
  @IsString()
  @IsNotEmpty()
  empresa: string;

  @ApiProperty({
    description: 'Motivo de la visita',
    example: 'Reunión con el equipo de desarrollo',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiProperty({
    description: 'Fecha y hora estimada de la visita (formato ISO 8601)',
    example: '2025-11-28T14:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaHoraEstimada: string;

  @ApiPropertyOptional({
    description: 'ID del usuario autorizante (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  autorizanteId?: string;

  @ApiPropertyOptional({
    description: 'ID del recepcionista (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  recepcionistaId?: string;
}
