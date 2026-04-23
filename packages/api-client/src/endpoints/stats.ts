import { apiClient } from "../client";
import { DashboardStats, RectorDashboardStats } from "@domas/ts-types";

export const stats = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>("/stats/dashboard");
    return response.data;
  },

  getRectorDashboard: async (): Promise<RectorDashboardStats> => {
    const response = await apiClient.get<RectorDashboardStats>("/stats/rector");
    return response.data;
  },
};
