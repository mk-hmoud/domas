import { apiClient } from "../client";
import {
  Bed,
  CreateBedDto,
  UpdateBedDto,
  FindAllBedsDto,
  PaginatedResult,
  UpdateBedTrOnlyDto,
  UpdateBedForeignerOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedIsRectorateDto,
  BulkCreateBedDto,
  BulkDeleteBedDto,
  BulkUpdateBedStatusDto,
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedForeignerOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedIsRectorateDto,
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

  findByLocation: async (locationId: number): Promise<Bed[]> => {
    const response = await apiClient.get<PaginatedResult<Bed>>("/beds", {
      params: { locationId, limit: 1000 },
    });
    return response.data.data;
  },

  update: async (id: number, data: UpdateBedDto): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}`, data);
    return response.data;
  },

  updateTrOnly: async (id: number, data: UpdateBedTrOnlyDto): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/tr-only`, data);
    return response.data;
  },

  updateForeignerOnly: async (
    id: number,
    data: UpdateBedForeignerOnlyDto,
  ): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(
      `/beds/${id}/foreigner-only`,
      data,
    );
    return response.data;
  },

  updateIsRectorate: async (
    id: number,
    data: UpdateBedIsRectorateDto,
  ): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/rectorate`, data);
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

  updateForeignerOnlyMany: async (
    data: BulkUpdateBedForeignerOnlyDto,
  ): Promise<void> => {
    await apiClient.patch("/beds/bulk-foreigner-only", data);
  },

  updateIsRectorateMany: async (
    data: BulkUpdateBedIsRectorateDto,
  ): Promise<void> => {
    await apiClient.patch("/beds/bulk-rectorate", data);
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
