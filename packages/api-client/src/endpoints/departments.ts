import { apiClient } from "../client";
import {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@domas/ts-types";

export const departments = {
  findAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>("/departments");
    return response.data;
  },

  create: async (data: CreateDepartmentDto): Promise<Department> => {
    const response = await apiClient.post<Department>("/departments", data);
    return response.data;
  },

  update: async (
    nameEn: string,
    data: UpdateDepartmentDto,
  ): Promise<Department> => {
    const response = await apiClient.patch<Department>(
      `/departments/${encodeURIComponent(nameEn)}`,
      data,
    );
    return response.data;
  },

  delete: async (nameEn: string): Promise<void> => {
    await apiClient.delete(`/departments/${encodeURIComponent(nameEn)}`);
  },
};
