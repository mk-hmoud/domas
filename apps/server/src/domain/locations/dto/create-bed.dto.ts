import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BedStatus } from '../../../common/enums/bed-status.enum';

export class CreateBedDto {
  @IsNumber()
  @IsNotEmpty()
  locationId!: number;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;
}
