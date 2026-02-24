import { PaginationDto } from "./pagination.dto";
import { LocationType } from "../enums/location-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";
import { BedStatus } from "../enums/bed-status.enum";

export interface FindAllLocationsDto extends PaginationDto {
  q?: string;
  type?: LocationType;
  genderLock?: GenderType;
  isTrOnly?: boolean;
  isGuestZone?: boolean;
  ownership?: LocationOwnership;
  parentId?: number;
  onlyVacant?: boolean;
  status?: BedStatus;
}
