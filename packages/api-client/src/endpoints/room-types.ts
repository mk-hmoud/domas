import { apiClient } from "../client";
import {
  RoomType,
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
} from "@domas/ts-types";

export const roomTypes = {
  findAll: async (): Promise<RoomType[]> => {
    const response = await apiClient.get<RoomType[]>("/room-types");
    return response.data;
  },

  findById: async (id: number): Promise<RoomType> => {
    const response = await apiClient.get<RoomType>(`/room-types/${id}`);
    return response.data;
  },

  create: async (data: CreateRoomTypeDto): Promise<RoomType> => {
    const response = await apiClient.post<RoomType>("/room-types", data);
    return response.data;
  },

  update: async (id: number, data: UpdateRoomTypeDto): Promise<RoomType> => {
    const response = await apiClient.patch<RoomType>(`/room-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/room-types/${id}`);
  },

  uploadImage: async (id: number, file: File): Promise<RoomType> => {
    const fd = new FormData();
    fd.append("image", file);
    const response = await apiClient.post<RoomType>(
      `/room-types/${id}/images`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  removeImage: async (id: number, index: number): Promise<RoomType> => {
    const response = await apiClient.delete<RoomType>(
      `/room-types/${id}/images/${index}`,
    );
    return response.data;
  },
};
