import { SemesterType } from "../enums/semester-type.enum";
import { SemesterStatus } from "../enums/semester-status.enum";

export interface UpdateSemesterDto {
  type?: SemesterType;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
  depositAmountTry?: number;
  depositAmountForeign?: number;
  foreignCurrencyCode?: string;
  paymentDeadlineDate?: string;
  status?: SemesterStatus;
  paidRoomChangeAfter?: number | null;
  roomChangeAmountTry?: number;
  roomChangeAmountForeign?: number;
}
