import { LocationOwnership } from "../enums/location-ownership.enum";

export interface UpdateBedTrOnlyDto {
  isTrOnly: boolean;
}

export interface UpdateBedForeignerOnlyDto {
  isForeignerOnly: boolean;
}

export interface UpdateBedGuestZoneDto {
  isGuestZone: boolean;
}

export interface UpdateBedOwnershipDto {
  ownership: LocationOwnership;
}

export interface BulkUpdateBedTrOnlyDto {
  ids: number[];
  isTrOnly: boolean;
}

export interface BulkUpdateBedForeignerOnlyDto {
  ids: number[];
  isForeignerOnly: boolean;
}

export interface BulkUpdateBedGuestZoneDto {
  ids: number[];
  isGuestZone: boolean;
}

export interface BulkUpdateBedOwnershipDto {
  ids: number[];
  ownership: LocationOwnership;
}
