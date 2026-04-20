import { SemesterStatus } from "../enums/semester-status.enum";
import { SemesterType } from "../enums/semester-type.enum";

export interface SemesterRoomPricingRow {
  roomTypeId: number;
  roomTypeName: string;
  capacity: number;
  priceTry: number | null;
  priceForeign: number | null;
}

export interface SemesterRoomPricingItemDto {
  roomTypeId: number;
  priceTry: number;
  priceForeign?: number | null;
}

export interface SetSemesterPricingDto {
  items: SemesterRoomPricingItemDto[];
}

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
  maxRoomChanges: number | null;
  createdAt: string;
  updatedAt: string;
}
