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
  pendingAccounting: number;
}

export interface RoomChangeStats {
  pendingCount: number;
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

export interface RectorDashboardStats {
  activeResidents: number;
  checkInsToday: number;
  checkOutsToday: number;
  pendingApproval: number;
  totalStudents: number;
  studentsWithoutBooking: number;
  pendingPayments: number;
  overduePayments: number;
  pendingDamages: number;
  pendingRoomChanges: number;
}

export interface DashboardStats {
  bookings?: BookingStats;
  damages?: DamageStats;
  guests?: GuestStats;
  students?: StudentStats;
  finances?: FinanceStats;
  roomChanges?: RoomChangeStats;
  pendingBookings?: PendingBookingRow[];
  pendingDamages?: PendingDamageRow[];
}
