import { apiClient } from "../client";
import {
  RecentChange,
  SuspiciousActivity,
  BulkOperation,
  SearchAuditDto,
  PaginatedResult,
  AuditLogEntry,
  UndoLog,
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

  getRecentUndos: async (): Promise<UndoLog[]> => {
    const response = await apiClient.get<UndoLog[]>("/audit/undo/recent");
    return response.data;
  },

  undo: async (id: string): Promise<void> => {
    await apiClient.post(`/audit/undo/${id}`);
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
