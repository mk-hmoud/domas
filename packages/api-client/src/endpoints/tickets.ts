import { apiClient } from "../client";
import {
  TicketView,
  ResolveTicketDto,
  RejectTicketDto,
  EscalateTicketDto,
  TicketStatus,
  TicketCategory,
} from "@domas/ts-types";

export const tickets = {
  getAll: async (params?: {
    status?: TicketStatus;
    category?: TicketCategory;
  }): Promise<TicketView[]> => {
    const response = await apiClient.get<TicketView[]>("/tickets", { params });
    return response.data;
  },

  resolve: async (id: string, dto: ResolveTicketDto): Promise<TicketView> => {
    const response = await apiClient.patch<TicketView>(
      `/tickets/${id}/resolve`,
      dto,
    );
    return response.data;
  },

  reject: async (id: string, dto: RejectTicketDto): Promise<TicketView> => {
    const response = await apiClient.patch<TicketView>(
      `/tickets/${id}/reject`,
      dto,
    );
    return response.data;
  },

  escalate: async (id: string, dto: EscalateTicketDto): Promise<TicketView> => {
    const response = await apiClient.patch<TicketView>(
      `/tickets/${id}/escalate`,
      dto,
    );
    return response.data;
  },
};
