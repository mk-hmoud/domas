import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsEmail,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  studentNumber?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(GenderType)
  @IsOptional()
  gender?: GenderType;

  @IsString()
  @Length(2, 10)
  @IsOptional()
  nationalityCode?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  birthPlace?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
