import { apiClient } from "../client";
import {
  WorkOrderView,
  AssignableTechnician,
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  UpdateWorkOrderStatusDto,
  UpdateWorkOrderDto,
  WorkOrderStatus,
  WorkOrderPriority,
} from "@domas/ts-types";

export const workOrders = {
  getAll: async (params?: {
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    locationId?: number;
  }): Promise<WorkOrderView[]> => {
    const response = await apiClient.get<WorkOrderView[]>("/work-orders", {
      params,
    });
    return response.data;
  },

  getAssignableTechnicians: async (): Promise<AssignableTechnician[]> => {
    const response = await apiClient.get<AssignableTechnician[]>(
      "/work-orders/assignable-technicians",
    );
    return response.data;
  },

  create: async (dto: CreateWorkOrderDto): Promise<WorkOrderView> => {
    const response = await apiClient.post<WorkOrderView>("/work-orders", dto);
    return response.data;
  },

  assign: async (
    id: string,
    dto: AssignWorkOrderDto,
  ): Promise<WorkOrderView> => {
    const response = await apiClient.patch<WorkOrderView>(
      `/work-orders/${id}/assign`,
      dto,
    );
    return response.data;
  },

  updateStatus: async (
    id: string,
    dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrderView> => {
    const response = await apiClient.patch<WorkOrderView>(
      `/work-orders/${id}/status`,
      dto,
    );
    return response.data;
  },

  update: async (
    id: string,
    dto: UpdateWorkOrderDto,
  ): Promise<WorkOrderView> => {
    const response = await apiClient.patch<WorkOrderView>(
      `/work-orders/${id}`,
      dto,
    );
    return response.data;
  },
};
