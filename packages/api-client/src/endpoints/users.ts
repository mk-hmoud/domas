import { apiClient } from "../client";
import {
  CreateUser,
  User,
  FindAllUsersDto,
  PaginatedResult,
} from "@domas/ts-types";

export const users = {
  create: async (data: CreateUser): Promise<User> => {
    const response = await apiClient.post<User>("/users", data);
    return response.data;
  },

  findAll: async (params?: FindAllUsersDto): Promise<PaginatedResult<User>> => {
    const response = await apiClient.get<PaginatedResult<User>>("/users", {
      params,
    });
    return response.data;
  },
};
