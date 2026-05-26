import { apiClient } from "../client";
import {
  DormCertificateRequest,
  DormCertificateEligibility,
  DormCertificateRequestStatus,
} from "@domas/ts-types";

// ─── Student Portal ───────────────────────────────────────────────────────────

export const portalDormCertificates = {
  getEligibility: async (): Promise<DormCertificateEligibility> => {
    const response = await apiClient.get<DormCertificateEligibility>(
      "/portal/dorm-certificate/eligibility",
    );
    return response.data;
  },

  getMyRequests: async (): Promise<DormCertificateRequest[]> => {
    const response = await apiClient.get<DormCertificateRequest[]>(
      "/portal/dorm-certificate/requests",
    );
    return response.data;
  },

  request: async (
    certFile?: File,
    expiryDate?: string,
  ): Promise<DormCertificateRequest> => {
    const form = new FormData();
    if (certFile) form.append("certificate", certFile);
    if (expiryDate) form.append("expiryDate", expiryDate);
    const response = await apiClient.post<DormCertificateRequest>(
      "/portal/dorm-certificate/request",
      form,
    );
    return response.data;
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const dormCertificates = {
  listAll: async (
    status?: DormCertificateRequestStatus,
  ): Promise<DormCertificateRequest[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await apiClient.get<DormCertificateRequest[]>(
      "/dorm-certificates",
      {
        params,
      },
    );
    return response.data;
  },

  approve: async (id: string): Promise<DormCertificateRequest> => {
    const response = await apiClient.post<DormCertificateRequest>(
      `/dorm-certificates/${id}/approve`,
    );
    return response.data;
  },

  reject: async (
    id: string,
    rejectionReason: string,
  ): Promise<DormCertificateRequest> => {
    const response = await apiClient.post<DormCertificateRequest>(
      `/dorm-certificates/${id}/reject`,
      { action: "reject", rejectionReason },
    );
    return response.data;
  },
};
