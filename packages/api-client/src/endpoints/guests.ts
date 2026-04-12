import { apiClient } from "../client";
import {
  Guest,
  GuestStay,
  CreateGuestDto,
  UpdateGuestDto,
  CreateGuestStayDto,
  UpdateGuestStayDto,
  FindGuestStaysDto,
} from "@domas/ts-types";

export const guests = {
  findAll: async (search?: string): Promise<Guest[]> => {
    const response = await apiClient.get<Guest[]>("/guests", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  findById: async (id: string): Promise<Guest> => {
    const response = await apiClient.get<Guest>(`/guests/${id}`);
    return response.data;
  },

  findByIdNumber: async (idNumber: string): Promise<Guest | null> => {
    const response = await apiClient.get<Guest | null>(
      `/guests/by-id-number/${encodeURIComponent(idNumber)}`,
    );
    return response.data;
  },

  create: async (data: CreateGuestDto): Promise<Guest> => {
    const response = await apiClient.post<Guest>("/guests", data);
    return response.data;
  },

  update: async (id: string, data: UpdateGuestDto): Promise<Guest> => {
    const response = await apiClient.patch<Guest>(`/guests/${id}`, data);
    return response.data;
  },
};

export const guestStays = {
  findAll: async (filters: FindGuestStaysDto = {}): Promise<GuestStay[]> => {
    const response = await apiClient.get<GuestStay[]>("/guest-stays", {
      params: filters,
    });
    return response.data;
  },

  findById: async (id: string): Promise<GuestStay> => {
    const response = await apiClient.get<GuestStay>(`/guest-stays/${id}`);
    return response.data;
  },

  create: async (data: CreateGuestStayDto): Promise<GuestStay> => {
    const response = await apiClient.post<GuestStay>("/guest-stays", data);
    return response.data;
  },

  update: async (id: string, data: UpdateGuestStayDto): Promise<GuestStay> => {
    const response = await apiClient.patch<GuestStay>(
      `/guest-stays/${id}`,
      data,
    );
    return response.data;
  },

  checkIn: async (id: string): Promise<GuestStay> => {
    const response = await apiClient.post<GuestStay>(
      `/guest-stays/${id}/check-in`,
    );
    return response.data;
  },

  checkOut: async (id: string): Promise<GuestStay> => {
    const response = await apiClient.post<GuestStay>(
      `/guest-stays/${id}/check-out`,
    );
    return response.data;
  },

  cancel: async (id: string): Promise<GuestStay> => {
    const response = await apiClient.post<GuestStay>(
      `/guest-stays/${id}/cancel`,
    );
    return response.data;
  },
};
