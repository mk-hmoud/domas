import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { StudentYearLock } from '../../../common/enums/student-year-lock.enum';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[] = [];

  @IsInt()
  @Min(1)
  @Max(8)
  capacity!: number;

  @IsEnum(GenderType)
  @IsOptional()
  genderLock?: GenderType | null;

  @IsEnum(StudentYearLock)
  @IsOptional()
  studentYearLock?: StudentYearLock | null;

  @IsBoolean()
  @IsOptional()
  isGuestZone?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isTrOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isForeignerOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isRectorate?: boolean = false;
}

export class UpdateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameTr?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionTr?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryUrls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsInt()
  @Min(1)
  @Max(8)
  @IsOptional()
  capacity?: number;

  @IsEnum(GenderType)
  @IsOptional()
  genderLock?: GenderType | null;

  @IsEnum(StudentYearLock)
  @IsOptional()
  studentYearLock?: StudentYearLock | null;

  @IsBoolean()
  @IsOptional()
  isGuestZone?: boolean;

  @IsBoolean()
  @IsOptional()
  isTrOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isForeignerOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isRectorate?: boolean;
}
