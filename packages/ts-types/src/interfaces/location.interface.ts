import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";

export interface Location {
  id: number;
  name: string;
  treePath: string;
  type: LocationType;
  genderLock: GenderType | null;
  studentYearLock: StudentYearLock | null;
  isGuestZone: boolean;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  ownership: LocationOwnership;
  roomTypeId?: number | null;
  roomTypeName?: string;
  locationPath?: string;
  createdAt: Date;
  updatedAt: Date;
}
