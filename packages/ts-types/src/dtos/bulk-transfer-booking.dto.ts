export interface BulkTransferBookingDto {
  bookingIds: string[];
  targetSemesterId: number;
  startDate?: string;
  endDate?: string;
}
