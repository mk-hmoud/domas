import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLocationDto } from './create-location.dto';

export class CreateRoomWithBedsDto extends CreateLocationDto {}

export class BulkCreateRoomWithBedsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomWithBedsDto)
  rooms!: CreateRoomWithBedsDto[];
}
