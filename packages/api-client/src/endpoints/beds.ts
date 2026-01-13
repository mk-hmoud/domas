import { apiClient } from "../client";
import {
  Bed,
  CreateBedDto,
  UpdateBedDto,
  FindAllBedsDto,
  PaginatedResult,
} from "@domas/ts-types";

export const beds = {
  create: async (data: CreateBedDto): Promise<Bed> => {
    const response = await apiClient.post<Bed>("/beds", data);
    return response.data;
  },

  findAll: async (params?: FindAllBedsDto): Promise<PaginatedResult<Bed>> => {
    const response = await apiClient.get<PaginatedResult<Bed>>("/beds", {
      params,
    });
    return response.data;
  },

  findOne: async (id: number): Promise<Bed> => {
    const response = await apiClient.get<Bed>(`/beds/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateBedDto): Promise<Bed> => {
    const response = await apiClient.patch<Bed>(`/beds/${id}`, data);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/beds/${id}`);
  },
};
