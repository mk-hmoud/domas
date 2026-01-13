import { apiClient } from "../client";
import {
  Semester,
  CreateSemesterDto,
  UpdateSemesterDto,
  FindAllSemestersDto,
  PaginatedResult,
} from "@domas/ts-types";

export const semesters = {
  create: async (data: CreateSemesterDto): Promise<Semester> => {
    const response = await apiClient.post<Semester>("/semesters", data);
    return response.data;
  },

  findAll: async (
    params?: FindAllSemestersDto,
  ): Promise<PaginatedResult<Semester>> => {
    const response = await apiClient.get<PaginatedResult<Semester>>(
      "/semesters",
      { params },
    );
    return response.data;
  },

  findOne: async (id: number): Promise<Semester> => {
    const response = await apiClient.get<Semester>(`/semesters/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateSemesterDto): Promise<Semester> => {
    const response = await apiClient.patch<Semester>(`/semesters/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: number): Promise<Semester> => {
    const response = await apiClient.patch<Semester>(
      `/semesters/${id}/toggle-active`,
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/semesters/${id}`);
  },
};
