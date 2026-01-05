import { BedStatus } from "../enums/bed-status.enum";

export interface Bed {
  id: number;
  locationId: number;
  label: string;
  status: BedStatus;
  updatedAt: Date;
}
