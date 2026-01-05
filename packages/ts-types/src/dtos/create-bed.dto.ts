import { BedStatus } from "../enums/bed-status.enum";

export interface CreateBedDto {
  locationId: number;
  label: string;
  status?: BedStatus;
}
