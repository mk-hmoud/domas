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

export interface DashboardStats {
  bookings?: BookingStats;
  damages?: DamageStats;
  guests?: GuestStats;
  students?: StudentStats;
  finances?: FinanceStats;
}
