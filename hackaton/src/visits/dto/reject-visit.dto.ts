import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectVisitDto {
  @IsNotEmpty({ message: 'La razón del rechazo es obligatoria' })
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  razon: string;
}
