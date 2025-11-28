import { IsString, IsNotEmpty } from 'class-validator';

export class CheckInVisitDto {
  @IsString()
  @IsNotEmpty()
  recepcionistaId: string;
}
