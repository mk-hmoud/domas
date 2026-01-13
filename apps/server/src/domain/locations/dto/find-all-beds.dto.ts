import { IsEnum, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BedStatus } from '../../../common/enums/bed-status.enum';

export class FindAllBedsDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;
}
