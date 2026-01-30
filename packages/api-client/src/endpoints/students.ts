import { apiClient } from "../client";
import {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  FindAllStudentsDto,
  PaginatedResult,
  BulkDeleteStudentsDto,
  BulkUpdateStudentStatusDto,
} from "@domas/ts-types";

export const students = {
  create: async (data: CreateStudentDto): Promise<Student> => {
    const response = await apiClient.post<Student>("/students", data);
    return response.data;
  },

  deleteMany: async (data: BulkDeleteStudentsDto): Promise<void> => {
    await apiClient.post("/students/bulk-delete", data);
  },

  updateStatusMany: async (data: BulkUpdateStudentStatusDto): Promise<void> => {
    await apiClient.patch("/students/bulk-status", data);
  },

  updateStatus: async (id: string, isActive: boolean): Promise<Student> => {
    const response = await apiClient.patch<Student>(`/students/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  findAll: async (
    params?: FindAllStudentsDto,
  ): Promise<PaginatedResult<Student>> => {
    const response = await apiClient.get<PaginatedResult<Student>>(
      "/students",
      { params },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    const response = await apiClient.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};
