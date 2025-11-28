import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AceptVisitPendingDto {
  @ApiPropertyOptional({
    description: 'Razón adicional (opcional)',
    example: 'Se aprueba con restricción de área',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  razon?: string;

  @ApiProperty({
    description:
      'Indica si se acepta (true) o rechaza (false) la visita pendiente',
    example: true,
  })
  @IsNotEmpty({ message: 'La aceptación o rechazo es obligatoria' })
  aceptar: boolean;
}
