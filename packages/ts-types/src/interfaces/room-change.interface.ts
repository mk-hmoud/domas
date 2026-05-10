export type RoomChangeStatus =
  | "pending"
  | "pending_payment"
  | "approved"
  | "rejected";

export interface RoomChangeRequest {
  id: string;
  bookingId: string;
  studentId: string;
  semesterId: number;
  requestedBedId: number | null;
  currentBedId: number;
  status: RoomChangeStatus;
  note: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  requiresPayment: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  isAccountingApproved: boolean | null;
  accountingApprovedBy: string | null;
  accountingApprovedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Enriched view for staff queue
export interface RoomChangeRequestView extends RoomChangeRequest {
  studentName: string;
  studentNumber: string;
  studentNationalityCode: string;
  semesterDisplayName: string;
  currentBedLabel: string;
  currentLocationPath: string;
  requestedBedLabel: string | null;
  requestedLocationPath: string | null;
}

// Student-facing view
export interface StudentRoomChangeView {
  id: string;
  status: RoomChangeStatus;
  note: string | null;
  requestedBedLabel: string | null;
  requestedLocationPath: string | null;
  rejectionReason: string | null;
  requiresPayment: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  isAccountingApproved: boolean | null;
  createdAt: string;
  resolvedAt: string | null;
}

// Bed option returned for the staff move-bed picker
export interface StaffAvailableBed {
  id: number;
  label: string;
  roomId: number;
  roomName: string;
  locationPath: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface StudentCreateRoomChangeDto {
  requestedBedId?: number;
  note?: string;
}

export interface ResolveRoomChangeDto {
  approved: boolean;
  rejectionReason?: string;
  assignedBedId?: number;
}

export interface ApproveRoomChangePaymentDto {
  approved: boolean;
  rejectionReason?: string;
}
