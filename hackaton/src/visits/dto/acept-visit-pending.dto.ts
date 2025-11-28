import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AceptVisitPendingDto {
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  razon: string;

  @IsNotEmpty({ message: 'La aceptación o rechazo es obligatoria' })
  aceptar: boolean;
}