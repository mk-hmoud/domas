export type PreReservationStatus =
  | "pending"
  | "assigned"
  | "cancelled"
  | "rejected";

export interface PreReservation {
  id: string;
  studentId: string;
  semesterId: number;
  startDate: string;
  endDate: string;
  roomTypeId: number | null;
  note: string | null;
  status: PreReservationStatus;
  bookingId: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Enriched view for staff queue
export interface PreReservationView extends PreReservation {
  studentName: string;
  studentNumber: string;
  semesterDisplayName: string;
  roomTypeName: string | null;
  roomTypeNameTr?: string | null;
}

// Student-facing view
export interface StudentPreReservationView {
  id: string;
  semesterId: number;
  semesterDisplayName: string;
  startDate: string;
  endDate: string;
  roomTypeId: number | null;
  roomTypeName: string | null;
  roomTypeNameTr?: string | null;
  note: string | null;
  status: PreReservationStatus;
  bookingId: string | null;
  rejectionReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface StudentCreatePreReservationDto {
  semesterId: number;
  startDate: string;
  endDate: string;
  roomTypeId?: number;
  note?: string;
}

export interface AssignPreReservationDto {
  bedId: number;
}

export interface RejectPreReservationDto {
  rejectionReason?: string;
}
