export interface CreateGuestDto {
  firstName: string;
  lastName: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateGuestDto {
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateGuestStayDto {
  guestId: string;
  bedId: number;
  checkInDate: string;
  checkOutDate: string;
  paymentRequired?: boolean;
  amountDue?: number;
  currency?: string;
  paymentNotes?: string;
  notes?: string;
}

export interface UpdateGuestStayDto {
  checkInDate?: string;
  checkOutDate?: string;
  paymentRequired?: boolean;
  amountDue?: number;
  amountPaid?: number;
  currency?: string;
  paymentNotes?: string;
  notes?: string;
}

export interface FindGuestStaysDto {
  status?: string;
  upcoming?: boolean;
  bedId?: number;
}
