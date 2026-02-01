import { IsArray, IsEnum, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBedDto } from './create-bed.dto';
import { BedStatus } from '../../../common/enums/bed-status.enum';

export class BulkCreateBedDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBedDto)
  beds!: CreateBedDto[];
}

export class BulkDeleteBedDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];
}

export class BulkUpdateBedStatusDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];

  @IsEnum(BedStatus)
  status!: BedStatus;
}
