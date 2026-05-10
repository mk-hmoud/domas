import { IsInt, Min } from 'class-validator';

export class AssignPreReservationDto {
  @IsInt()
  @Min(1)
  bedId: number;
}
