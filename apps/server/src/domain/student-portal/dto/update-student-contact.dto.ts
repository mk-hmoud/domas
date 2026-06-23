import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateStudentContactDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;
}
