import { IsInt, IsNotEmpty } from 'class-validator';

export class StudentCreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  semesterId!: number;

  @IsInt()
  @IsNotEmpty()
  bedId!: number;
}
