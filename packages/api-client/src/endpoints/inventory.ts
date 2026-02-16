import { apiClient } from "../client";
import {
  InventoryCatalogItem,
  InventoryAssignment,
  CreateInventoryCatalogDto,
  UpdateInventoryCatalogDto,
  CreateInventoryAssignmentDto,
  UpdateInventoryAssignmentDto,
} from "@domas/ts-types";

export const inventory = {
  // --- Catalog ---
  createCatalog: async (
    data: CreateInventoryCatalogDto,
  ): Promise<InventoryCatalogItem> => {
    const response = await apiClient.post<InventoryCatalogItem>(
      "/inventory/catalog",
      data,
    );
    return response.data;
  },

  findAllCatalog: async (
    params: { scope?: string; isActive?: boolean } = {},
  ): Promise<InventoryCatalogItem[]> => {
    const response = await apiClient.get<InventoryCatalogItem[]>(
      "/inventory/catalog",
      { params },
    );
    return response.data;
  },

  getCatalogById: async (id: number): Promise<InventoryCatalogItem> => {
    const response = await apiClient.get<InventoryCatalogItem>(
      `/inventory/catalog/${id}`,
    );
    return response.data;
  },

  updateCatalog: async (
    id: number,
    data: UpdateInventoryCatalogDto,
  ): Promise<InventoryCatalogItem> => {
    const response = await apiClient.patch<InventoryCatalogItem>(
      `/inventory/catalog/${id}`,
      data,
    );
    return response.data;
  },

  deleteCatalog: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventory/catalog/${id}`);
  },

  // --- Assignments ---
  createAssignment: async (
    data: CreateInventoryAssignmentDto,
  ): Promise<InventoryAssignment> => {
    const response = await apiClient.post<InventoryAssignment>(
      "/inventory/assignments",
      data,
    );
    return response.data;
  },

  findByLocation: async (
    locationId: number,
  ): Promise<InventoryAssignment[]> => {
    const response = await apiClient.get<InventoryAssignment[]>(
      `/inventory/assignments/location/${locationId}`,
    );
    return response.data;
  },

  findByBed: async (bedId: number): Promise<InventoryAssignment[]> => {
    const response = await apiClient.get<InventoryAssignment[]>(
      `/inventory/assignments/bed/${bedId}`,
    );
    return response.data;
  },

  updateAssignment: async (
    id: string,
    data: UpdateInventoryAssignmentDto,
  ): Promise<InventoryAssignment> => {
    const response = await apiClient.patch<InventoryAssignment>(
      `/inventory/assignments/${id}`,
      data,
    );
    return response.data;
  },

  deleteAssignment: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/assignments/${id}`);
  },

  // --- Extras ---
  getAvailableExtras: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>("/inventory/available-extras");
    return response.data;
  },

  findActiveSnapshotsByLocation: async (locationId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/inventory/active-snapshots/${locationId}`,
    );
    return response.data;
  },

  findSnapshotsByBooking: async (bookingId: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/inventory/snapshots/booking/${bookingId}`,
    );
    return response.data;
  },

  getMixedInventory: async (locationId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/inventory/active-mixed/${locationId}`,
    );
    return response.data;
  },
};
