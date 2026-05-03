import { apiClient } from "../client";
import {
  DamageReport,
  DamageReportImage,
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

  uploadImages: async (
    id: string,
    files: File[],
  ): Promise<DamageReportImage[]> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    const response = await apiClient.post<DamageReportImage[]>(
      `/damages/reports/${id}/images`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  getImageUrl: async (
    id: string,
    imageId: string,
  ): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>(
      `/damages/reports/${id}/images/${imageId}/url`,
    );
    return response.data;
  },

  deleteImage: async (id: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/damages/reports/${id}/images/${imageId}`);
  },
};
