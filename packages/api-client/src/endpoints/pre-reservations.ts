import { apiClient } from "../client";
import {
  PreReservationView,
  PreReservationStatus,
  AssignPreReservationDto,
  RejectPreReservationDto,
  StaffAvailableBed,
} from "@domas/ts-types";

// Staff endpoints for managing pre-reservations
export const preReservations = {
  getAll: async (params?: {
    semesterId?: number;
    status?: PreReservationStatus;
  }): Promise<PreReservationView[]> => {
    const response = await apiClient.get<PreReservationView[]>(
      "/pre-reservations",
      { params },
    );
    return response.data;
  },

  assign: async (
    id: string,
    dto: AssignPreReservationDto,
  ): Promise<PreReservationView> => {
    const response = await apiClient.patch<PreReservationView>(
      `/pre-reservations/${id}/assign`,
      dto,
    );
    return response.data;
  },

  reject: async (
    id: string,
    dto: RejectPreReservationDto,
  ): Promise<PreReservationView> => {
    const response = await apiClient.patch<PreReservationView>(
      `/pre-reservations/${id}/reject`,
      dto,
    );
    return response.data;
  },

  getAvailableBeds: async (
    semesterId: number,
    startDate: string,
    endDate: string,
  ): Promise<StaffAvailableBed[]> => {
    const response = await apiClient.get<StaffAvailableBed[]>(
      "/pre-reservations/available-beds",
      { params: { semesterId, startDate, endDate } },
    );
    return response.data;
  },
};
