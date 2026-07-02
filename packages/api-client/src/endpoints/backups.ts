import { apiClient } from "../client";

export interface BackupFile {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

export const backups = {
  list: async (): Promise<BackupFile[]> => {
    const response = await apiClient.get<BackupFile[]>("/backups");
    return response.data;
  },

  create: async (): Promise<BackupFile> => {
    const response = await apiClient.post<BackupFile>("/backups/create");
    return response.data;
  },

  download: (name: string): string => {
    const base =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
    return `${base}/backups/download/${encodeURIComponent(name)}`;
  },

  delete: async (name: string): Promise<void> => {
    await apiClient.delete(`/backups/${encodeURIComponent(name)}`);
  },
};
