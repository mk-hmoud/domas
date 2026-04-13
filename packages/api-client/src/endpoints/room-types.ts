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
};
