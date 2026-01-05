import { BedStatus } from "../enums/bed-status.enum";

export interface UpdateBedDto {
  locationId?: number;
  label?: string;
  status?: BedStatus;
}
