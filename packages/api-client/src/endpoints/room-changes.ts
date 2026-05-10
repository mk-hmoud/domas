import { apiClient } from "../client";
import {
  RoomChangeRequestView,
  ResolveRoomChangeDto,
  ApproveRoomChangePaymentDto,
  StaffAvailableBed,
} from "@domas/ts-types";

// Staff endpoints for managing room change requests
export const roomChanges = {
  getAll: async (params?: {
    semesterId?: number;
    status?: string;
  }): Promise<RoomChangeRequestView[]> => {
    const response = await apiClient.get<RoomChangeRequestView[]>(
      "/room-changes",
      { params },
    );
    return response.data;
  },

  resolve: async (
    id: string,
    dto: ResolveRoomChangeDto,
  ): Promise<RoomChangeRequestView> => {
    const response = await apiClient.patch<RoomChangeRequestView>(
      `/room-changes/${id}/resolve`,
      dto,
    );
    return response.data;
  },

  moveBed: async (bookingId: string, bedId: number): Promise<void> => {
    await apiClient.post(`/room-changes/bookings/${bookingId}/move-bed`, {
      bedId,
    });
  },

  getAvailableBeds: async (bookingId: string): Promise<StaffAvailableBed[]> => {
    const response = await apiClient.get<StaffAvailableBed[]>(
      `/room-changes/bookings/${bookingId}/available-beds`,
    );
    return response.data;
  },

  approvePayment: async (
    id: string,
    dto: ApproveRoomChangePaymentDto,
  ): Promise<RoomChangeRequestView> => {
    const response = await apiClient.patch<RoomChangeRequestView>(
      `/room-changes/${id}/approve-payment`,
      dto,
    );
    return response.data;
  },
};
