import { apiClient } from "../client";
import {
  Announcement,
  AnnouncementAttachmentMeta,
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

  // ─── Attachments ─────────────────────────────────────────────────────────────

  uploadAttachments: async (
    id: string,
    files: File[],
  ): Promise<Announcement> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("attachments", f));
    const response = await apiClient.post<Announcement>(
      `/announcements/${id}/attachments`,
      fd,
    );
    return response.data;
  },

  deleteAttachment: async (id: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}/attachments/${attachmentId}`);
  },

  downloadAttachment: async (
    id: string,
    attachmentId: string,
    filename: string,
  ): Promise<void> => {
    const response = await apiClient.get(
      `/announcements/${id}/attachments/${attachmentId}`,
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export const portalAnnouncements = {
  getAll: async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>(
      "/portal/announcements",
    );
    return response.data;
  },

  downloadAttachment: async (
    id: string,
    attachmentId: string,
    filename: string,
  ): Promise<void> => {
    const response = await apiClient.get(
      `/portal/announcements/${id}/attachments/${attachmentId}`,
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
