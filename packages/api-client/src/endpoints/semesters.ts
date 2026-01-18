import { apiClient } from "../client";
import {
  Semester,
  CreateSemesterDto,
  UpdateSemesterDto,
  FindAllSemestersDto,
  PaginatedResult,
  SemesterStatus,
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

  updateStatus: async (
    id: number,
    status: SemesterStatus,
  ): Promise<Semester> => {
    const response = await apiClient.patch<Semester>(
      `/semesters/${id}/status`,
      { status },
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/semesters/${id}`);
  },
};
