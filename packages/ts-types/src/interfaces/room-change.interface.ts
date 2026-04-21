export type RoomChangeStatus = "pending" | "approved" | "rejected";

export interface RoomChangeRequest {
  id: string;
  bookingId: string;
  studentId: string;
  semesterId: number;
  requestedBedId: number;
  currentBedId: number;
  status: RoomChangeStatus;
  note: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Enriched view for staff queue
export interface RoomChangeRequestView extends RoomChangeRequest {
  studentName: string;
  studentNumber: string;
  semesterDisplayName: string;
  currentBedLabel: string;
  currentLocationPath: string;
  requestedBedLabel: string;
  requestedLocationPath: string;
}

// Student-facing view
export interface StudentRoomChangeView {
  id: string;
  status: RoomChangeStatus;
  note: string | null;
  requestedBedLabel: string;
  requestedLocationPath: string;
  rejectionReason: string | null;
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
  requestedBedId: number;
  note?: string;
}

export interface ResolveRoomChangeDto {
  approved: boolean;
  rejectionReason?: string;
}
