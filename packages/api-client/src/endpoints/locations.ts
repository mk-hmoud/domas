import { apiClient } from "../client";
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedResult,
  PaginationDto,
  BulkCreateLocationDto,
  BulkUpdateLocationDto,
  BulkDeleteLocationDto,
  UpdateGenderLockDto,
  UpdateGuestZoneDto,
  UpdateTrOnlyDto,
  UpdateOwnershipDto,
  BulkUpdateGenderLockDto,
  BulkUpdateGuestZoneDto,
  BulkUpdateTrOnlyDto,
  BulkUpdateOwnershipDto,
  CreateRoomWithBedsDto,
  BulkCreateRoomWithBedsDto,
} from "@domas/ts-types";

export const locations = {
  create: async (data: CreateLocationDto): Promise<Location> => {
    const response = await apiClient.post<Location>("/locations", data);
    return response.data;
  },

  createRoomWithBeds: async (
    data: CreateRoomWithBedsDto,
  ): Promise<Location> => {
    const response = await apiClient.post<Location>(
      "/locations/room-with-beds",
      data,
    );
    return response.data;
  },

  createRoomsWithBedsMany: async (
    data: BulkCreateRoomWithBedsDto,
  ): Promise<Location[]> => {
    const response = await apiClient.post<Location[]>(
      "/locations/bulk-room-with-beds",
      data,
    );
    return response.data;
  },

  createMany: async (data: BulkCreateLocationDto): Promise<Location[]> => {
    const response = await apiClient.post<Location[]>("/locations/bulk", data);
    return response.data;
  },

  findAll: async (
    params?: PaginationDto,
  ): Promise<PaginatedResult<Location>> => {
    const response = await apiClient.get<PaginatedResult<Location>>(
      "/locations",
      { params },
    );
    return response.data;
  },

  findById: async (id: number): Promise<Location> => {
    const response = await apiClient.get<Location>(`/locations/${id}`);
    return response.data;
  },

  findChildren: async (id: number): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(
      `/locations/${id}/children`,
    );
    return response.data;
  },

  findWithAncestors: async (id: number): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(
      `/locations/${id}/ancestors`,
    );
    return response.data;
  },

  search: async (query: string): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>("/locations/search", {
      params: { q: query },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateLocationDto): Promise<Location> => {
    const response = await apiClient.patch<Location>(`/locations/${id}`, data);
    return response.data;
  },

  updateGenderLock: async (
    id: number,
    data: UpdateGenderLockDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/gender-lock`,
      data,
    );
    return response.data;
  },

  updateGuestZone: async (
    id: number,
    data: UpdateGuestZoneDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/guest-zone`,
      data,
    );
    return response.data;
  },

  updateTrOnly: async (
    id: number,
    data: UpdateTrOnlyDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/tr-only`,
      data,
    );
    return response.data;
  },

  updateOwnership: async (
    id: number,
    data: UpdateOwnershipDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/ownership`,
      data,
    );
    return response.data;
  },

  updateMany: async (data: BulkUpdateLocationDto): Promise<void> => {
    await apiClient.patch("/locations/bulk", data);
  },

  updateGenderLockMany: async (
    data: BulkUpdateGenderLockDto,
  ): Promise<void> => {
    await apiClient.patch("/locations/bulk-gender-lock", data);
  },

  updateGuestZoneMany: async (data: BulkUpdateGuestZoneDto): Promise<void> => {
    await apiClient.patch("/locations/bulk-guest-zone", data);
  },

  updateTrOnlyMany: async (data: BulkUpdateTrOnlyDto): Promise<void> => {
    await apiClient.patch("/locations/bulk-tr-only", data);
  },

  updateOwnershipMany: async (data: BulkUpdateOwnershipDto): Promise<void> => {
    await apiClient.patch("/locations/bulk-ownership", data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/${id}`);
  },

  deleteMany: async (data: BulkDeleteLocationDto): Promise<void> => {
    await apiClient.post("/locations/bulk-delete", data);
  },
};
