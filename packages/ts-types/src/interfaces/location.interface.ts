import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface Location {
  id: number;
  name: string;
  treePath: string;
  type: LocationType;
  genderLock: GenderType | null;
  isGuestZone: boolean;
  isTrOnly: boolean;
  ownership: LocationOwnership;
  basePrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}
