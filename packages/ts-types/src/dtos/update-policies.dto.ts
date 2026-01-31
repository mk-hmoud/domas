import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface UpdateGenderLockDto {
  genderLock: GenderType | null;
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

export interface UpdateOwnershipDto {
  ownership: LocationOwnership;
  cascade?: boolean;
}
