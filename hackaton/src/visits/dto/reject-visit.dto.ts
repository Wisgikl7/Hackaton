import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectVisitDto {
  @ApiProperty({
    description: 'Razón por la cual se rechaza la visita',
    example: 'El autorizante no se encuentra disponible en la fecha solicitada',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'La razón del rechazo es obligatoria' })
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  razon: string;
}
