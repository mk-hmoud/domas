import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { StudentYearLock } from '../../../common/enums/student-year-lock.enum';

export class UpdateGenderLockDto {
  @IsEnum(GenderType)
  @IsOptional() // Allow null to unlock
  genderLock!: GenderType | null;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class UpdateStudentYearLockDto {
  @IsEnum(StudentYearLock)
  @IsOptional()
  studentYearLock!: StudentYearLock | null;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class UpdateGuestZoneDto {
  @IsBoolean()
  @IsNotEmpty()
  isGuestZone!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class UpdateTrOnlyDto {
  @IsBoolean()
  @IsNotEmpty()
  isTrOnly!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class UpdateForeignerOnlyDto {
  @IsBoolean()
  @IsNotEmpty()
  isForeignerOnly!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}

export class UpdateIsRectorateDto {
  @IsBoolean()
  @IsNotEmpty()
  isRectorate!: boolean;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}
