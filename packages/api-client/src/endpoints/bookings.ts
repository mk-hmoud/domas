import { apiClient } from "../client";
import {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  ApproveFinancialsDto,
  BookingOpsStatus,
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

  checkIn: async (id: string): Promise<Booking> => {
    const response = await apiClient.post<Booking>(`/bookings/${id}/check-in`);
    return response.data;
  },
};
