import { BedStatus } from "../enums/bed-status.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface Bed {
  id: number;
  locationId: number;
  label: string;
  status: BedStatus;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  isGuestZone: boolean;
  ownership: LocationOwnership;
  updatedAt: Date;
  locationName?: string;
  locationPath?: string;
  totalBeds?: number;
  occupiedBeds?: number;
  residentName?: string;
  type?: string;
}
