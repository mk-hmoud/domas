import { SemesterType } from "../enums/semester-type.enum";
import { SemesterStatus } from "../enums/semester-status.enum";

export interface CreateSemesterDto {
  type: SemesterType;
  academicYear: string;
  startDate: string;
  endDate: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
  depositAmountTry?: number;
  depositAmountForeign?: number;
  foreignCurrencyCode?: string;
  paymentDeadlineDate?: string;
  status?: SemesterStatus;
  maxRoomChanges?: number | null;
}
