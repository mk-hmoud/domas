import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";

export interface UpdateLocationDto {
  name?: string;
  type?: LocationType;
  genderLock?: GenderType;
  isGuestZone?: boolean;
  capacity?: number;
  basePrice?: number;
}
