import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";

export interface CreateLocationDto {
  name: string;
  nameTr?: string;
  parentId?: number;
  type: LocationType;
  genderLock?: GenderType;
  studentYearLock?: StudentYearLock;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  ownership?: LocationOwnership;
  roomTypeId?: number;
}
