export interface BookingStats {
  pendingApproval: number;
  activeResidents: number;
  checkInsToday: number;
  checkOutsToday: number;
}

export interface DamageStats {
  pendingReports: number;
}

export interface GuestStats {
  activeStays: number;
  checkInsToday: number;
}

export interface StudentStats {
  total: number;
  withoutActiveBooking: number;
}

export interface FinanceStats {
  pendingPayments: number;
  overdueCount: number;
}

export interface PendingBookingRow {
  id: string;
  studentName: string;
  studentNumber: string;
  locationPath: string;
  startDate: string;
  endDate: string;
}

export interface PendingDamageRow {
  id: string;
  locationName: string;
  description: string;
  reportedAt: string;
}

export interface DashboardStats {
  bookings?: BookingStats;
  damages?: DamageStats;
  guests?: GuestStats;
  students?: StudentStats;
  finances?: FinanceStats;
  pendingBookings?: PendingBookingRow[];
  pendingDamages?: PendingDamageRow[];
}
