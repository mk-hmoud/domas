import { BedStatus } from "../enums/bed-status.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface Bed {
  id: number;
  locationId: number;
  label: string;
  status: BedStatus;
  isTrOnly: boolean;
  isGuestZone: boolean;
  ownership: LocationOwnership;
  updatedAt: Date;
}
