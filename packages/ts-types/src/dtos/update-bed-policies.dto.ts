import { LocationOwnership } from "../enums/location-ownership.enum";

export interface UpdateBedTrOnlyDto {
  isTrOnly: boolean;
}

export interface UpdateBedGuestZoneDto {
  isGuestZone: boolean;
}

export interface UpdateBedOwnershipDto {
  ownership: LocationOwnership;
}
