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
  @Length(2, 2)
  @IsNotEmpty()
  nationalityCode!: string;

  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEmail()
  @IsOptional()
  email?: string; // Contact email

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // If linking to existing user immediately
}
