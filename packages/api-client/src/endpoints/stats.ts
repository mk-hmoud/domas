import { apiClient } from "../client";
import { DashboardStats } from "@domas/ts-types";

export const stats = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>("/stats/dashboard");
    return response.data;
  },
};
