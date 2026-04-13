import { apiClient } from "../client";
import {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "@domas/ts-types";

export const announcements = {
  create: async (data: CreateAnnouncementDto): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>("/announcements", data);
    return response.data;
  },

  findAll: async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>("/announcements");
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateAnnouncementDto,
  ): Promise<Announcement> => {
    const response = await apiClient.patch<Announcement>(
      `/announcements/${id}`,
      data,
    );
    return response.data;
  },

  publish: async (id: string): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>(
      `/announcements/${id}/publish`,
    );
    return response.data;
  },

  unpublish: async (id: string): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>(
      `/announcements/${id}/unpublish`,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
  },
};
