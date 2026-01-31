import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

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

export interface BulkUpdateOwnershipDto {
  ids: number[];
  ownership: LocationOwnership;
  cascade?: boolean;
}
