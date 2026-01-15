import { apiClient } from "../client";
import {
  RecentChange,
  SuspiciousActivity,
  BulkOperation,
  SearchAuditDto,
  PaginatedResult,
  AuditLogEntry,
} from "@domas/ts-types";

export const audit = {
  search: async (
    data: SearchAuditDto,
  ): Promise<PaginatedResult<AuditLogEntry>> => {
    const response = await apiClient.post<PaginatedResult<AuditLogEntry>>(
      "/audit/search",
      data,
    );
    return response.data;
  },

  getRecentChanges: async (limit?: number): Promise<RecentChange[]> => {
    const response = await apiClient.get<RecentChange[]>(
      "/audit/recent-changes",
      { params: { limit } },
    );
    return response.data;
  },

  getSuspiciousActivity: async (): Promise<SuspiciousActivity[]> => {
    const response = await apiClient.get<SuspiciousActivity[]>(
      "/audit/suspicious-activity",
    );
    return response.data;
  },

  getBulkOperations: async (limit?: number): Promise<BulkOperation[]> => {
    const response = await apiClient.get<BulkOperation[]>(
      "/audit/bulk-operations",
      { params: { limit } },
    );
    return response.data;
  },
};
