import { CreateLocationDto } from "./create-location.dto";

export interface CreateRoomWithBedsDto extends CreateLocationDto {
  bedCount: number;
}

export interface BulkCreateRoomWithBedsDto {
  rooms: CreateRoomWithBedsDto[];
}
