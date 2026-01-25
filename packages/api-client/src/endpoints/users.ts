import { apiClient } from "../client";
import {
  CreateUserDto,
  User,
  FindAllUsersDto,
  PaginatedResult,
  UpdateUserDto,
} from "@domas/ts-types";

export const users = {
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post<User>("/users", data);
    return response.data;
  },

  findAll: async (params?: FindAllUsersDto): Promise<PaginatedResult<User>> => {
    const response = await apiClient.get<PaginatedResult<User>>("/users", {
      params,
    });
    return response.data;
  },

  findById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
