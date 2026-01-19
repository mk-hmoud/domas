import { apiClient } from "../client";
import {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  FindAllStudentsDto,
  PaginatedResult,
} from "@domas/ts-types";

export const students = {
  create: async (data: CreateStudentDto): Promise<Student> => {
    const response = await apiClient.post<Student>("/students", data);
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
};
