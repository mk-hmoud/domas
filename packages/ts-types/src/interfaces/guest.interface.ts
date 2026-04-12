import { GuestStayStatus } from "../enums/guest-stay-status.enum";

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface GuestStay {
  id: string;
  guestId: string;
  guest: Pick<
    Guest,
    "id" | "firstName" | "lastName" | "idNumber" | "email" | "phone"
  >;
  bedId: number;
  bedLabel: string;
  roomName: string;
  locationPath: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  status: GuestStayStatus;
  paymentRequired: boolean;
  amountDue?: number;
  amountPaid: number;
  currency: string;
  paymentNotes?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
