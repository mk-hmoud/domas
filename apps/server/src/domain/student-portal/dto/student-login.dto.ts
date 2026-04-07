import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  studentNumber!: string;
}
