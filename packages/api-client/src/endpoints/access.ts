import { apiClient } from "../client";
import { Role, Permission, CreateRoleDto } from "@domas/ts-types";

export const access = {
  findAllRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>("/access/roles");
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

  assignRole: async (userId: string, roleId: number): Promise<void> => {
    await apiClient.post(`/access/users/${userId}/roles/${roleId}`);
  },
};
