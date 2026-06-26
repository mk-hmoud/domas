import { GenderType } from "../enums/gender-type.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";

export interface UpdateGenderLockDto {
  genderLock: GenderType | null;
  cascade?: boolean;
}

export interface UpdateStudentYearLockDto {
  studentYearLock: StudentYearLock | null;
  cascade?: boolean;
}

export interface UpdateGuestZoneDto {
  isGuestZone: boolean;
  cascade?: boolean;
}

export interface UpdateTrOnlyDto {
  isTrOnly: boolean;
  cascade?: boolean;
}

export interface UpdateForeignerOnlyDto {
  isForeignerOnly: boolean;
  cascade?: boolean;
}

export interface UpdateIsRectorateDto {
  isRectorate: boolean;
  cascade?: boolean;
}

export interface BulkUpdateGenderLockDto {
  ids: number[];
  genderLock: GenderType | null;
  cascade?: boolean;
}

export interface BulkUpdateGuestZoneDto {
  ids: number[];
  isGuestZone: boolean;
  cascade?: boolean;
}

export interface BulkUpdateTrOnlyDto {
  ids: number[];
  isTrOnly: boolean;
  cascade?: boolean;
}

export interface BulkUpdateForeignerOnlyDto {
  ids: number[];
  isForeignerOnly: boolean;
  cascade?: boolean;
}

export interface BulkUpdateIsRectorateDto {
  ids: number[];
  isRectorate: boolean;
  cascade?: boolean;
}
