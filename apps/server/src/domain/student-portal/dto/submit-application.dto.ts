import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { DEPARTMENTS } from '../../../common/constants/departments';
import type { ApplicationDocumentType } from '../entities/student-application.entity';

export class SubmitApplicationDto {
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
  gender!: GenderType;

  @IsString()
  @Length(2, 2)
  nationalityCode!: string;

  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @IsDateString()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  birthPlace!: string;

  @IsString()
  @IsIn(DEPARTMENTS)
  department!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsEnum(['freshman', 'returning'] as ApplicationDocumentType[])
  @IsOptional()
  documentType?: ApplicationDocumentType;

  @IsDateString()
  @IsOptional()
  documentExpiryDate?: string;
}
