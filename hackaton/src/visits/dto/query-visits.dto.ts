import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class QueryVisitsDto {
  @IsOptional()
  @IsString()
  autorizanteId?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRE_AUTORIZADA', 'EN_RECEPCION', 'APROBADA', 'RECHAZADA'])
  estado?: string;
}
