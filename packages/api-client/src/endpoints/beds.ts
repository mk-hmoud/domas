import { apiClient } from "../client";
import {
  Bed,
  CreateBedDto,
  UpdateBedDto,
  FindAllBedsDto,
  PaginatedResult,
  UpdateBedTrOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedOwnershipDto,
  BulkCreateBedDto,
  BulkDeleteBedDto,
  BulkUpdateBedStatusDto,
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedOwnershipDto,
} from "@domas/ts-types";

export const beds = {
  create: async (data: CreateBedDto): Promise<Bed> => {
    const response = await apiClient.post<Bed>("/beds", data);
    return response.data;
  },

  findAll: async (params?: FindAllBedsDto): Promise<PaginatedResult<Bed>> => {
    const response = await apiClient.get<PaginatedResult<Bed>>("/beds", {
      params,
    });
    return response.data;
  },

  findEligible: async (studentId: string): Promise<Bed[]> => {
    const response = await apiClient.get<Bed[]>("/beds/eligible-beds", {
      params: { studentId },
    });
    return response.data;
  },

  findOne: async (id: number): Promise<Bed> => {
    const response = await apiClient.get<Bed>(`/beds/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateBedDto): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}`, data);
    return response.data;
  },

  updateTrOnly: async (id: number, data: UpdateBedTrOnlyDto): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/tr-only`, data);
    return response.data;
  },

  updateOwnership: async (
    id: number,
    data: UpdateBedOwnershipDto,
  ): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/ownership`, data);
    return response.data;
  },

  updateGuestZone: async (
    id: number,
    data: UpdateBedGuestZoneDto,
  ): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/guest-zone`, data);
    return response.data;
  },

  createMany: async (data: BulkCreateBedDto): Promise<Bed[]> => {
    const response = await apiClient.post<Bed[]>("/beds/bulk", data);
    return response.data;
  },

  deleteMany: async (data: BulkDeleteBedDto): Promise<void> => {
    await apiClient.post("/beds/bulk-delete", data);
  },

  updateStatusMany: async (data: BulkUpdateBedStatusDto): Promise<void> => {
    await apiClient.patch("/beds/bulk-status", data);
  },

  updateTrOnlyMany: async (data: BulkUpdateBedTrOnlyDto): Promise<void> => {
    await apiClient.patch("/beds/bulk-tr-only", data);
  },

  updateOwnershipMany: async (
    data: BulkUpdateBedOwnershipDto,
  ): Promise<void> => {
    await apiClient.patch("/beds/bulk-ownership", data);
  },

  updateGuestZoneMany: async (
    data: BulkUpdateBedGuestZoneDto,
  ): Promise<void> => {
    await apiClient.patch("/beds/bulk-guest-zone", data);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/beds/${id}`);
  },
};
