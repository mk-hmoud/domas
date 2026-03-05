import { BookingOpsStatus } from "../enums/booking-ops-status.enum";

export interface FindAllBookingsDto {
  studentId?: string;
  semesterId?: number;
  status?: BookingOpsStatus;
}
