import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  studentNumber!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEnum(GenderType)
  @IsNotEmpty()
  gender!: GenderType;

  @IsString()
  @Length(2, 10)
  @IsNotEmpty()
  nationalityCode!: string;

  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  birthPlace!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsEmail()
  @IsOptional()
  email?: string; // Contact email

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // If linking to existing user immediately
}
