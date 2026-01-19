import { IsEnum, IsOptional, IsString, Length, IsEmail, IsUUID, IsBoolean } from 'class-validator';
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
  @Length(2, 2)
  @IsOptional()
  nationalityCode?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
