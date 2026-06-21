import { apiClient } from "../client";
import {
  Student,
  PortalSemester,
  AvailableBed,
  BedWithOccupancy,
  PortalBuilding,
  RoomTypeCatalogItem,
  StudentBookingView,
  StudentCurrentBooking,
  StudentTransaction,
  StudentDamageLiability,
  StudentNotification,
  StudentLoginDto,
  UpdateStudentContactDto,
  StudentCreateBookingDto,
  Announcement,
  StudentCreateRoomChangeDto,
  StudentRoomChangeView,
  EnrollmentVerification,
  EnrollmentStatus,
  StudentApplication,
  SubmitApplicationDto,
  StudentCreatePreReservationDto,
  StudentPreReservationView,
  Conversation,
  SendMessageDto,
  StudentTicketView,
  CreateTicketDto,
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

  getAvailableBeds: async (
    semesterId: number,
    roomTypeId?: number | null,
  ): Promise<AvailableBed[]> => {
    const params: Record<string, string> = {};
    if (roomTypeId != null) params.roomTypeId = String(roomTypeId);
    const response = await apiClient.get<AvailableBed[]>(
      `/portal/semesters/${semesterId}/available-beds`,
      { params },
    );
    return response.data;
  },

  getAllBeds: async (
    semesterId: number,
    roomTypeId?: number | null,
  ): Promise<BedWithOccupancy[]> => {
    const params: Record<string, string> = {};
    if (roomTypeId != null) params.roomTypeId = String(roomTypeId);
    const response = await apiClient.get<BedWithOccupancy[]>(
      `/portal/semesters/${semesterId}/all-beds`,
      { params },
    );
    return response.data;
  },

  getBuildings: async (semesterId: number): Promise<PortalBuilding[]> => {
    const response = await apiClient.get<PortalBuilding[]>(
      `/portal/semesters/${semesterId}/buildings`,
    );
    return response.data;
  },

  getRoomCatalog: async (
    semesterId: number,
    filters?: { buildingId?: number | null; capacity?: number | null },
  ): Promise<RoomTypeCatalogItem[]> => {
    const params: Record<string, string> = {};
    if (filters?.buildingId != null)
      params.buildingId = String(filters.buildingId);
    if (filters?.capacity != null) params.capacity = String(filters.capacity);
    const response = await apiClient.get<RoomTypeCatalogItem[]>(
      `/portal/semesters/${semesterId}/room-catalog`,
      { params },
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
};

// ─── Realtime (SSE) ───────────────────────────────────────────────────────────

export interface RealtimeEnvelope<T = unknown> {
  channel: string;
  data: T;
}

export const portalRealtime = {
  /**
   * Opens the single Server-Sent Events connection that multiplexes every
   * realtime channel (notifications, messages, ...) for the logged-in
   * student. Returns the EventSource instance — caller is responsible for
   * closing it.
   */
  stream: (
    baseURL: string,
    onEnvelope: (envelope: RealtimeEnvelope) => void,
  ): EventSource => {
    const es = new EventSource(`${baseURL}/portal/notifications/stream`, {
      withCredentials: true,
    });
    es.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data) as RealtimeEnvelope;
        onEnvelope(envelope);
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

// ─── Room Changes ─────────────────────────────────────────────────────────────

// ─── Enrollment ───────────────────────────────────────────────────────────────

export const portalEnrollment = {
  getStatus: async (): Promise<EnrollmentStatus> => {
    const response = await apiClient.get<EnrollmentStatus>(
      "/portal/enrollment/status",
    );
    return response.data;
  },

  uploadCertificate: async (
    file: File,
    expiryDate?: string,
  ): Promise<EnrollmentVerification> => {
    const form = new FormData();
    form.append("certificate", file);
    if (expiryDate) form.append("expiryDate", expiryDate);
    const response = await apiClient.post<EnrollmentVerification>(
      "/portal/enrollment/certificate",
      form,
    );
    return response.data;
  },
};

// ─── Room Changes ─────────────────────────────────────────────────────────────

export const portalRoomChanges = {
  getAll: async (): Promise<StudentRoomChangeView[]> => {
    const response = await apiClient.get<StudentRoomChangeView[]>(
      "/portal/room-changes",
    );
    return response.data;
  },

  create: async (
    semesterId: number,
    dto: StudentCreateRoomChangeDto,
  ): Promise<StudentRoomChangeView> => {
    const response = await apiClient.post<StudentRoomChangeView>(
      `/portal/room-changes/${semesterId}`,
      dto,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/portal/room-changes/${id}`);
  },
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const portalTickets = {
  getAll: async (): Promise<StudentTicketView[]> => {
    const response =
      await apiClient.get<StudentTicketView[]>("/portal/tickets");
    return response.data;
  },

  create: async (dto: CreateTicketDto): Promise<StudentTicketView> => {
    const response = await apiClient.post<StudentTicketView>(
      "/portal/tickets",
      dto,
    );
    return response.data;
  },
};

// ─── Pre-Reservations ─────────────────────────────────────────────────────────

export const portalPreReservations = {
  getAll: async (): Promise<StudentPreReservationView[]> => {
    const response = await apiClient.get<StudentPreReservationView[]>(
      "/portal/pre-reservations",
    );
    return response.data;
  },

  create: async (
    dto: StudentCreatePreReservationDto,
  ): Promise<StudentPreReservationView> => {
    const response = await apiClient.post<StudentPreReservationView>(
      "/portal/pre-reservations",
      dto,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.patch(`/portal/pre-reservations/${id}/cancel`);
  },
};

// ─── Applications (public — no session required) ──────────────────────────────

export const portalApplications = {
  submit: async (
    dto: SubmitApplicationDto,
    documentFile: File,
  ): Promise<StudentApplication> => {
    const form = new FormData();
    form.append("letter", documentFile);
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) form.append(key, String(value));
    });
    const response = await apiClient.post<StudentApplication>(
      "/portal/applications",
      form,
    );
    return response.data;
  },

  getStatus: async (id: string): Promise<StudentApplication> => {
    const response = await apiClient.get<StudentApplication>(
      `/portal/applications/${id}/status`,
    );
    return response.data;
  },

  getMine: async (): Promise<StudentApplication> => {
    const response = await apiClient.get<StudentApplication>(
      "/portal/applications/mine",
    );
    return response.data;
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const portalMessages = {
  getMine: async (): Promise<Conversation | null> => {
    const response = await apiClient.get<Conversation | null>(
      "/portal/messages",
    );
    return response.data;
  },

  send: async (data: SendMessageDto): Promise<void> => {
    await apiClient.post("/portal/messages", data);
  },

  markRead: async (): Promise<void> => {
    await apiClient.patch("/portal/messages/read");
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      "/portal/messages/unread-count",
    );
    return response.data.count;
  },
};
