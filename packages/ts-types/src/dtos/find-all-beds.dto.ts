import { PaginationDto } from "./pagination.dto";
import { BedStatus } from "../enums/bed-status.enum";
import { GenderType } from "../enums/gender-type.enum";

export interface FindAllBedsDto extends PaginationDto {
  q?: string;
  locationId?: number;
  status?: BedStatus;
  genderLock?: GenderType;
  isTrOnly?: boolean;
  isForeignerOnly?: boolean;
  isGuestZone?: boolean;
  isRectorate?: boolean;
}
