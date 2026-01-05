import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";

export interface Location {
  id: number;
  name: string;
  treePath: string;
  type: LocationType;
  genderLock: GenderType | null;
  isGuestZone: boolean;
  capacity: number;
  basePrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}
