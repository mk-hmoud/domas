import { GenderType } from "../enums/gender-type.enum";
import { StudentYearLock } from "../enums/student-year-lock.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";
import { BedStatus } from "../enums/bed-status.enum";
import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

export interface RoomPlanOccupant {
  studentId: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: GenderType;
  nationalityCode: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  paymentStatus: PaymentStatus;
  checkedInAt?: string;
}

export interface RoomPlanPendingBooking {
  bookingId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  startDate: string;
  status: BookingOpsStatus;
}

export interface RoomPlanBed {
  id: number;
  label: string;
  status: BedStatus;
  occupant: RoomPlanOccupant | null;
  pendingBooking: RoomPlanPendingBooking | null;
}

export interface RoomPlanRoom {
  id: number;
  name: string;
  nameTr?: string;
  genderLock: GenderType | null;
  studentYearLock: StudentYearLock | null;
  isGuestZone: boolean;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  ownership: LocationOwnership;
  roomTypeId: number;
  roomTypeName: string;
  capacity: number;
  parentLocationId: number;
  parentLocationName: string;
  parentLocationNameTr?: string;
  beds: RoomPlanBed[];
}
