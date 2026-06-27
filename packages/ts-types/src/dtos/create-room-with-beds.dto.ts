import { CreateLocationDto } from "./create-location.dto";

export interface CreateRoomWithBedsDto extends CreateLocationDto {}

export interface BulkCreateRoomWithBedsDto {
  rooms: CreateRoomWithBedsDto[];
}
