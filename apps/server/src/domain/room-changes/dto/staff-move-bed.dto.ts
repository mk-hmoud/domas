import { IsInt } from 'class-validator';

export class StaffMoveBedDto {
  @IsInt()
  bedId!: number;
}
