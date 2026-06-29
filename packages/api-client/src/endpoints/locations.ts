import { apiClient } from "../client";
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedResult,
  FindAllLocationsDto,
  BulkCreateLocationDto,
  BulkUpdateLocationDto,
  BulkDeleteLocationDto,
  UpdateGenderLockDto,
  UpdateStudentYearLockDto,
  UpdateGuestZoneDto,
  UpdateTrOnlyDto,
  UpdateForeignerOnlyDto,
  UpdateIsRectorateDto,
  BulkUpdateGenderLockDto,
  BulkUpdateGuestZoneDto,
  BulkUpdateTrOnlyDto,
  BulkUpdateForeignerOnlyDto,
  BulkUpdateIsRectorateDto,
  CreateRoomWithBedsDto,
  BulkCreateRoomWithBedsDto,
  RoomPlanRoom,
  LocationFlagContext,
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
    params?: FindAllLocationsDto,
  ): Promise<
    PaginatedResult<Location & { totalBeds?: number; occupiedBeds?: number }>
  > => {
    const response = await apiClient.get<
      PaginatedResult<Location & { totalBeds?: number; occupiedBeds?: number }>
    >("/locations", { params });
    return response.data;
  },

  findById: async (id: number): Promise<Location> => {
    const response = await apiClient.get<Location>(`/locations/${id}`);
    return response.data;
  },

  getResidents: async (id: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/locations/${id}/residents`);
    return response.data;
  },

  getRoomPlan: async (id: number): Promise<RoomPlanRoom[]> => {
    const response = await apiClient.get<RoomPlanRoom[]>(
      `/locations/${id}/room-plan`,
    );
    return response.data;
  },

  getInventoryMixed: async (id: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/locations/${id}/inventory-mixed`,
    );
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

  search: async (query: string, includePath?: boolean): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>("/locations/search", {
      params: { q: query, includePath: includePath ? "true" : undefined },
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

  updateStudentYearLock: async (
    id: number,
    data: UpdateStudentYearLockDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/student-year-lock`,
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

  updateForeignerOnly: async (
    id: number,
    data: UpdateForeignerOnlyDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/foreigner-only`,
      data,
    );
    return response.data;
  },

  updateIsRectorate: async (
    id: number,
    data: UpdateIsRectorateDto,
  ): Promise<Location> => {
    const response = await apiClient.patch<Location>(
      `/locations/${id}/rectorate`,
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

  updateForeignerOnlyMany: async (
    data: BulkUpdateForeignerOnlyDto,
  ): Promise<void> => {
    await apiClient.patch("/locations/bulk-foreigner-only", data);
  },

  updateIsRectorateMany: async (
    data: BulkUpdateIsRectorateDto,
  ): Promise<void> => {
    await apiClient.patch("/locations/bulk-rectorate", data);
  },

  getFlagContext: async (id: number): Promise<LocationFlagContext> => {
    const response = await apiClient.get<LocationFlagContext>(
      `/locations/${id}/flag-context`,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/${id}`);
  },

  deleteMany: async (data: BulkDeleteLocationDto): Promise<void> => {
    await apiClient.post("/locations/bulk-delete", data);
  },
};
