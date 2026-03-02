import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface UpdateLocationDto {
  name?: string;
  type?: LocationType;
  genderLock?: GenderType;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  ownership?: LocationOwnership;
  basePrice?: number;
}
