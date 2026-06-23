import { BookingOpsStatus } from "../enums/booking-ops-status.enum";
import { PaymentStatus } from "../enums/payment-status.enum";
import { SemesterStatus } from "../enums/semester-status.enum";
import { SemesterType } from "../enums/semester-type.enum";
import { GenderType } from "../enums/gender-type.enum";
import { LocationOwnership } from "../enums/location-ownership.enum";

// ─── Semesters ────────────────────────────────────────────────────────────────

export interface PortalSemester {
  id: number;
  type: SemesterType;
  academicYear: string;
  displayName: string;
  startDate: string;
  endDate: string;
  bookingStartDate: string | null;
  bookingEndDate: string | null;
  depositAmountTry: number;
  depositAmountForeign: number;
  foreignCurrencyCode: string;
  paymentDeadlineDate: string | null;
  status: SemesterStatus;
  allowPreReservations: boolean;
}

// ─── Available Beds ───────────────────────────────────────────────────────────

export interface BedWithOccupancy {
  id: number;
  label: string;
  status: string;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  ownership: LocationOwnership;
  roomId: number;
  roomName: string;
  roomTypeId: number;
  genderLock: GenderType | null;
  priceTry: number;
  priceForeign: number | null;
  locationPath: string;
  isTaken: boolean;
  occupantNationality: string | null;
  occupantDepartment: string | null;
}

export interface AvailableBed {
  id: number;
  label: string;
  status: string;
  isTrOnly: boolean;
  isForeignerOnly: boolean;
  ownership: LocationOwnership;
  roomId: number;
  roomName: string;
  roomTypeId: number;
  genderLock: GenderType | null;
  priceTry: number;
  priceForeign: number | null;
  locationPath: string;
}

export interface PortalBuilding {
  id: number;
  name: string;
  availableBedCount: number;
}

export interface RoomTypeCatalogItem {
  id: number;
  name: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls: string[];
  amenities: string[];
  capacity: number;
  priceTry: number;
  priceForeign: number | null;
  availableBedCount: number;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface StudentBookingView {
  id: string;
  studentId: string;
  bedId: number;
  semesterId: number;
  startDate: string;
  endDate: string;
  status: BookingOpsStatus;
  paymentStatus: PaymentStatus;
  isAccountingApproved: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  contractSigned: boolean;
  createdAt: string;
  // Joined fields
  semesterDisplayName: string;
  semesterStatus: SemesterStatus;
  bedLabel: string;
  roomName: string;
  roomNameTr?: string;
  roomId: number;
  locationPath: string;
}

export interface PortalRoomType {
  id: number;
  name: string;
  nameTr?: string;
  description?: string;
  descriptionTr?: string;
  galleryUrls: string[];
  amenities: string[];
}

export interface StudentCurrentBooking extends StudentBookingView {
  accountingApprovedAt: string | null;
  contractUrl: string | null;
  updatedAt: string;
  depositAmountTry: number;
  depositAmountForeign: number;
  foreignCurrencyCode: string;
  paymentDeadlineDate: string | null;
  accessCardNumber: number | null;
  accessCardStatus: string | null;
  // Room type display assets (null when room has no type assigned)
  roomTypeId: number | null;
  roomTypeName: string | null;
  roomTypeNameTr: string | null;
  roomTypeDescription: string | null;
  roomTypeDescriptionTr: string | null;
  roomTypeGalleryUrls: string[];
  roomTypeAmenities: string[];
  // Room change tracking
  roomChangesCount: number;
  maxRoomChanges: number | null;
}

// ─── Financial ────────────────────────────────────────────────────────────────

export interface StudentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  transactionType: "rent" | "deposit" | "fine";
  isApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
  semesterDisplayName: string;
}

export interface StudentDamageLiability {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  reportId: string;
  description: string;
  reportStatus: "pending" | "approved" | "rejected";
  reportedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationTypeValue =
  | "booking_submitted"
  | "booking_approved"
  | "booking_rejected"
  | "checkin_confirmed"
  | "checkout_processed"
  | "booking_dates_updated"
  | "damage_charge"
  | "access_card_issued"
  | "payment_deadline_reminder"
  | "room_change_approved"
  | "room_change_rejected";

export interface StudentNotification {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  metadata: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface StudentLoginDto {
  studentNumber: string;
}

export interface UpdateStudentContactDto {
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export interface StudentCreateBookingDto {
  semesterId: number;
  bedId: number;
}
