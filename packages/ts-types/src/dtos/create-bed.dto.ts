import { BedStatus } from "../enums/bed-status.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface CreateBedDto {
  locationId: number;
  label: string;
  status?: BedStatus;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isGuestZone?: boolean;
  ownership?: LocationOwnership;
}
