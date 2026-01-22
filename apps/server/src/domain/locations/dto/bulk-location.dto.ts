import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateLocationDto } from './create-location.dto';
import { UpdateLocationDto } from './update-location.dto';

export class BulkCreateLocationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLocationDto)
  locations!: CreateLocationDto[];
}

export class BulkUpdateLocationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateLocationDto)
  data!: UpdateLocationDto;
}

export class BulkDeleteLocationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];
}
