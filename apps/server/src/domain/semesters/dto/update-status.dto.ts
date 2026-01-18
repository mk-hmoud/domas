import { IsEnum, IsNotEmpty } from 'class-validator';
import { SemesterStatus } from '../../../common/enums/semester-status.enum';

export class UpdateStatusDto {
  @IsEnum(SemesterStatus)
  @IsNotEmpty()
  status!: SemesterStatus;
}
