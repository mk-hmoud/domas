import { LocationOwnership } from "../enums/location-ownership.enum";

export interface BulkUpdateBedTrOnlyDto {
  ids: number[];
  isTrOnly: boolean;
}

export interface BulkUpdateBedGuestZoneDto {
  ids: number[];
  isGuestZone: boolean;
}

export interface BulkUpdateBedOwnershipDto {
  ids: number[];
  ownership: LocationOwnership;
}
