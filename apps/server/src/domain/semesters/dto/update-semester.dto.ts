import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { SemesterType } from '../../../common/enums/semester-type.enum';
import { SemesterStatus } from '../../../common/enums/semester-status.enum';

export class UpdateSemesterDto {
  @IsEnum(SemesterType)
  @IsOptional()
  type?: SemesterType;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  bookingStartDate?: string;

  @IsDateString()
  @IsOptional()
  bookingEndDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmountTry?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmountForeign?: number;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  foreignCurrencyCode?: string;

  @IsDateString()
  @IsOptional()
  paymentDeadlineDate?: string;

  @IsEnum(SemesterStatus)
  @IsOptional()
  status?: SemesterStatus;

  @IsOptional()
  @ValidateIf((o) => o.maxRoomChanges !== null)
  @IsInt()
  @Min(0)
  maxRoomChanges?: number | null;
}
