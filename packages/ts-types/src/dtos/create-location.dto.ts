import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

export interface CreateLocationDto {
  name: string;
  parentId?: number;
  type: LocationType;
  genderLock?: GenderType;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  ownership?: LocationOwnership;
  basePrice?: number;
}
