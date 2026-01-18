import { SemesterStatus } from "../enums/semester-status.enum";
import { SemesterType } from "../enums/semester-type.enum";

export interface Semester {
  id: number;
  type: SemesterType;
  academicYear: string;
  displayName: string;
  startDate: string;
  endDate: string;
  bookingStartDate: string;
  bookingEndDate: string;
  depositAmountTry: number;
  depositAmountForeign: number;
  foreignCurrencyCode: string;
  paymentDeadlineDate?: string;
  status: SemesterStatus;
  autoActivate: boolean;
  autoClose: boolean;
  createdAt: string;
  updatedAt: string;
}
