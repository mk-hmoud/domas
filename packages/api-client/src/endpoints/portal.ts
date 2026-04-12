import { apiClient } from "../client";
import {
  Student,
  PortalSemester,
  AvailableBed,
  StudentBookingView,
  StudentCurrentBooking,
  StudentTransaction,
  StudentDamageLiability,
  StudentNotification,
  StudentLoginDto,
  UpdateStudentContactDto,
  StudentCreateBookingDto,
  Announcement,
} from "@domas/ts-types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const portalAuth = {
  login: async (dto: StudentLoginDto): Promise<Student> => {
    const response = await apiClient.post<Student>("/portal/auth/login", dto);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/portal/auth/logout");
  },

  me: async (): Promise<Student> => {
    const response = await apiClient.get<Student>("/portal/auth/me");
    return response.data;
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const portalProfile = {
  get: async (): Promise<Student> => {
    const response = await apiClient.get<Student>("/portal/me");
    return response.data;
  },

  updateContact: async (dto: UpdateStudentContactDto): Promise<Student> => {
    const response = await apiClient.patch<Student>("/portal/me", dto);
    return response.data;
  },
};

// ─── Semesters ────────────────────────────────────────────────────────────────

export const portalSemesters = {
  getBookable: async (): Promise<PortalSemester[]> => {
    const response = await apiClient.get<PortalSemester[]>("/portal/semesters");
    return response.data;
  },

  getAvailableBeds: async (semesterId: number): Promise<AvailableBed[]> => {
    const response = await apiClient.get<AvailableBed[]>(
      `/portal/semesters/${semesterId}/available-beds`,
    );
    return response.data;
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const portalBookings = {
  getAll: async (): Promise<StudentBookingView[]> => {
    const response =
      await apiClient.get<StudentBookingView[]>("/portal/bookings");
    return response.data;
  },

  getCurrent: async (): Promise<StudentCurrentBooking | null> => {
    const response = await apiClient.get<StudentCurrentBooking | null>(
      "/portal/bookings/current",
    );
    // NestJS serializes null as an empty body rather than JSON null;
    // normalize any non-object value to null so callers get a clean null.
    return response.data && typeof response.data === "object"
      ? response.data
      : null;
  },

  getById: async (id: string): Promise<StudentCurrentBooking> => {
    const response = await apiClient.get<StudentCurrentBooking>(
      `/portal/bookings/${id}`,
    );
    return response.data;
  },

  create: async (dto: StudentCreateBookingDto): Promise<StudentBookingView> => {
    const response = await apiClient.post<StudentBookingView>(
      "/portal/bookings",
      dto,
    );
    return response.data;
  },

  downloadContract: async (bookingId: string): Promise<void> => {
    const response = await apiClient.get(
      `/portal/bookings/${bookingId}/contract`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contract-${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ─── Financial ────────────────────────────────────────────────────────────────

export const portalFinancial = {
  getTransactions: async (): Promise<StudentTransaction[]> => {
    const response = await apiClient.get<StudentTransaction[]>(
      "/portal/transactions",
    );
    return response.data;
  },

  getDamageLiabilities: async (): Promise<StudentDamageLiability[]> => {
    const response =
      await apiClient.get<StudentDamageLiability[]>("/portal/damages");
    return response.data;
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const portalNotifications = {
  getAll: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<StudentNotification[]> => {
    const response = await apiClient.get<StudentNotification[]>(
      "/portal/notifications",
      { params },
    );
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      "/portal/notifications/unread-count",
    );
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/portal/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/portal/notifications/read-all");
  },

  /**
   * Opens a Server-Sent Events connection for live notification delivery.
   * Returns the EventSource instance — caller is responsible for closing it.
   */
  stream: (
    baseURL: string,
    onMessage: (notification: StudentNotification) => void,
  ): EventSource => {
    const es = new EventSource(`${baseURL}/portal/notifications/stream`, {
      withCredentials: true,
    });
    es.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as StudentNotification;
        onMessage(notification);
      } catch {
        // ignore malformed events
      }
    };
    return es;
  },
};

// ─── Announcements ────────────────────────────────────────────────────────────

export const portalAnnouncements = {
  getAll: async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>(
      "/portal/announcements",
    );
    return response.data;
  },
};
