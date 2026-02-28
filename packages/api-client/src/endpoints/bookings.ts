import { apiClient } from "../client";
import {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  UpdateBookingDatesDto,
  ApproveFinancialsDto,
  BookingOpsStatus,
  CheckInBookingDto,
  CheckOutBookingDto,
} from "@domas/ts-types";

export const bookings = {
  create: async (data: CreateBookingDto): Promise<Booking> => {
    const response = await apiClient.post<Booking>("/bookings", data);
    return response.data;
  },

  findAll: async (filters?: {
    studentId?: string;
    status?: BookingOpsStatus;
  }): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>("/bookings", {
      params: filters,
    });
    return response.data;
  },

  findById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateBookingDto): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}`, data);
    return response.data;
  },

  adjustDates: async (
    id: string,
    data: UpdateBookingDatesDto,
  ): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(
      `/bookings/${id}/dates`,
      data,
    );
    return response.data;
  },

  approveFinancials: async (
    id: string,
    data: ApproveFinancialsDto,
  ): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(
      `/bookings/${id}/approve-financials`,
      data,
    );
    return response.data;
  },

  checkIn: async (
    id: string,
    data: CheckInBookingDto,
  ): Promise<Booking & { assignedCardNumber?: number }> => {
    const response = await apiClient.post<
      Booking & { assignedCardNumber?: number }
    >(`/bookings/${id}/check-in`, data);
    return response.data;
  },

  checkOut: async (id: string, data: CheckOutBookingDto): Promise<Booking> => {
    const response = await apiClient.post<Booking>(
      `/bookings/${id}/check-out`,
      data,
    );
    return response.data;
  },
};
