import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";

export interface UpdateLocationDto {
  name?: string;
  nameTr?: string;
  type?: LocationType;
  genderLock?: GenderType;
  studentYearLock?: StudentYearLock | null;
  isGuestZone?: boolean;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isRectorate?: boolean;
  status?: string;
  roomTypeId?: number | null;
}
