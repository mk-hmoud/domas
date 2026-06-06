import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { GenderType } from '../../../common/enums/gender-type.enum';
import { StudentYearLock } from '../../../common/enums/student-year-lock.enum';
import { LocationOwnership } from '../../../common/enums/location-ownership.enum';

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

export class UpdateOwnershipDto {
  @IsEnum(LocationOwnership)
  @IsNotEmpty()
  ownership!: LocationOwnership;

  @IsBoolean()
  @IsOptional()
  cascade?: boolean = true;
}
