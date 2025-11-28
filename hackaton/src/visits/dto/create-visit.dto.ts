import { IsString, IsNotEmpty, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  nombreVisitante: string;

  @IsString()
  @IsNotEmpty()
  dniVisitante: string;

  @IsString()
  @IsNotEmpty()
  empresa: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsDateString()
  @IsNotEmpty()
  fechaHoraEstimada: string;

  @IsUUID()
  @IsOptional()
  autorizanteId?: string;
}
