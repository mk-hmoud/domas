import { apiClient } from "../client";
import {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  FindAllStudentsDto,
  PaginatedResult,
  BulkDeleteStudentsDto,
  BulkUpdateStudentStatusDto,
  ResolveContactsDto,
  ResolvedContact,
  EnrollmentVerification,
  StudentApplication,
  ApplicationStatus,
  StudentHistoryBooking,
  StudentNationalityStats,
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

  getStats: async (): Promise<StudentNationalityStats> => {
    const response =
      await apiClient.get<StudentNationalityStats>("/students/stats");
    return response.data;
  },

  findOne: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  getHistory: async (id: string): Promise<StudentHistoryBooking[]> => {
    const response = await apiClient.get<StudentHistoryBooking[]>(
      `/students/${id}/history`,
    );
    return response.data;
  },

  update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    const response = await apiClient.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  resolveContacts: async (
    data: ResolveContactsDto,
  ): Promise<ResolvedContact[]> => {
    const response = await apiClient.post<ResolvedContact[]>(
      "/students/resolve-contacts",
      data,
    );
    return response.data;
  },

  uploadPhoto: async (
    id: string,
    file: File,
  ): Promise<{ photoUrl: string }> => {
    const form = new FormData();
    form.append("photo", file);
    const response = await apiClient.post<{ photoUrl: string }>(
      `/students/${id}/photo`,
      form,
    );
    return response.data;
  },

  deletePhoto: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}/photo`);
  },

  getEnrollmentCerts: async (
    id: string,
  ): Promise<(EnrollmentVerification & { url?: string })[]> => {
    const response = await apiClient.get<
      (EnrollmentVerification & { url?: string })[]
    >(`/students/${id}/enrollment`);
    return response.data;
  },

  reviewEnrollmentCert: async (
    id: string,
    certId: string,
    action: "verify" | "reject",
    rejectionReason?: string,
  ): Promise<EnrollmentVerification> => {
    const response = await apiClient.patch<EnrollmentVerification>(
      `/students/${id}/enrollment/${certId}/review`,
      { action, rejectionReason },
    );
    return response.data;
  },

  getEnrollmentCertUrl: async (
    id: string,
    certId: string,
  ): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>(
      `/students/${id}/enrollment/${certId}/url`,
    );
    return response.data;
  },

  listApplications: async (
    status?: ApplicationStatus,
  ): Promise<(StudentApplication & { documentUrl: string })[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<
      (StudentApplication & { documentUrl: string })[]
    >("/students/applications", { params });
    return response.data;
  },

  reviewApplication: async (
    appId: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ): Promise<StudentApplication> => {
    const response = await apiClient.patch<StudentApplication>(
      `/students/applications/${appId}/review`,
      { action, rejectionReason },
    );
    return response.data;
  },

  getApplicationLetterUrl: async (appId: string): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>(
      `/students/applications/${appId}/letter-url`,
    );
    return response.data;
  },

  exportToExcel: async (
    params?: Pick<FindAllStudentsDto, "search" | "nationalityCode" | "gender">,
  ): Promise<void> => {
    const response = await apiClient.get("/students/export", {
      responseType: "blob",
      params,
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadImportTemplate: async (): Promise<void> => {
    const response = await apiClient.get("/students/import-template", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_import_template.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
