import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { SemesterType } from '../../../common/enums/semester-type.enum';
import { SemesterStatus } from '../../../common/enums/semester-status.enum';

export class CreateSemesterDto {
  @IsEnum(SemesterType)
  @IsNotEmpty()
  type!: SemesterType;

  @IsString()
  @IsNotEmpty()
  academicYear!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsDateString()
  @IsOptional()
  bookingStartDate?: string;

  @IsDateString()
  @IsOptional()
  bookingEndDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmountTry: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmountForeign: number = 0;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  foreignCurrencyCode: string = 'EUR';

  @IsDateString()
  @IsOptional()
  paymentDeadlineDate?: string;

  @IsEnum(SemesterStatus)
  @IsOptional()
  status?: SemesterStatus = SemesterStatus.PLANNED;

  @IsOptional()
  @ValidateIf((o) => o.maxRoomChanges !== null)
  @IsInt()
  @Min(0)
  maxRoomChanges?: number | null;

  @IsOptional()
  @ValidateIf((o) => o.paidRoomChangeAfter !== null)
  @IsInt()
  @Min(1)
  paidRoomChangeAfter?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  roomChangeAmountTry: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  roomChangeAmountForeign: number = 0;
}
