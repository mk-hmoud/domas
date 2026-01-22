import { CreateLocationDto } from "./create-location.dto";
import { UpdateLocationDto } from "./update-location.dto";

export interface BulkCreateLocationDto {
  locations: CreateLocationDto[];
}

export interface BulkUpdateLocationDto {
  ids: number[];
  data: UpdateLocationDto;
}

export interface BulkDeleteLocationDto {
  ids: number[];
}
