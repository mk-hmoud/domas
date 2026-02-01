import { BedStatus } from "../enums/bed-status.enum";
import { CreateBedDto } from "./create-bed.dto";

export interface BulkCreateBedDto {
  beds: CreateBedDto[];
}

export interface BulkDeleteBedDto {
  ids: number[];
}

export interface BulkUpdateBedStatusDto {
  ids: number[];
  status: BedStatus;
}
