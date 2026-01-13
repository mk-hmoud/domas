import { PaginationDto } from "./pagination.dto";
import { BedStatus } from "../enums/bed-status.enum";

export interface FindAllBedsDto extends PaginationDto {
  locationId?: number;
  status?: BedStatus;
}
