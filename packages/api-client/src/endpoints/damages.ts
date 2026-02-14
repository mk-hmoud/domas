import { apiClient } from "../client";
import {
  DamageReport,
  CreateDamageReportDto,
  DamageStatus,
} from "@domas/ts-types";

export const damages = {
  createReport: async (data: CreateDamageReportDto): Promise<DamageReport> => {
    const response = await apiClient.post<DamageReport>(
      "/damages/reports",
      data,
    );
    return response.data;
  },

  findAllReports: async (
    params: {
      status?: DamageStatus;
      locationId?: number;
    } = {},
  ): Promise<any[]> => {
    const response = await apiClient.get<any[]>("/damages/reports", { params });
    return response.data;
  },

  getReportById: async (
    id: string,
  ): Promise<DamageReport & { liabilities: any[] }> => {
    const response = await apiClient.get<DamageReport & { liabilities: any[] }>(
      `/damages/reports/${id}`,
    );
    return response.data;
  },

  approveReport: async (id: string): Promise<void> => {
    await apiClient.post(`/damages/reports/${id}/approve`);
  },

  rejectReport: async (id: string): Promise<void> => {
    await apiClient.post(`/damages/reports/${id}/reject`);
  },
};
