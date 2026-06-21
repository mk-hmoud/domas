import { apiClient } from "../client";
import {
  Role,
  Permission,
  CreateRoleDto,
  UpdateRoleDto,
  Location,
} from "@domas/ts-types";

export const access = {
  findAllRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>("/access/roles");
    return response.data;
  },

  findRoleById: async (id: number): Promise<Role> => {
    const response = await apiClient.get<Role>(`/access/roles/${id}`);
    return response.data;
  },

  findAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>("/access/permissions");
    return response.data;
  },

  createRole: async (data: CreateRoleDto): Promise<Role> => {
    const response = await apiClient.post<Role>("/access/roles", data);
    return response.data;
  },

  updateRole: async (id: number, data: UpdateRoleDto): Promise<Role> => {
    const response = await apiClient.patch<Role>(`/access/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/access/roles/${id}`);
  },

  assignRole: async (userId: string, roleId: number): Promise<void> => {
    await apiClient.post(`/access/users/${userId}/roles/${roleId}`);
  },

  revokeRole: async (userId: string, roleId: number): Promise<void> => {
    await apiClient.delete(`/access/users/${userId}/roles/${roleId}`);
  },

  getLocationsForUser: async (userId: string): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(
      `/access/users/${userId}/locations`,
    );
    return response.data;
  },

  assignLocation: async (userId: string, locationId: number): Promise<void> => {
    await apiClient.post(`/access/users/${userId}/locations/${locationId}`);
  },

  revokeLocation: async (userId: string, locationId: number): Promise<void> => {
    await apiClient.delete(`/access/users/${userId}/locations/${locationId}`);
  },
};
