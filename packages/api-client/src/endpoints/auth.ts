import { apiClient } from "../client";
import { LoginCredentials, User } from "@domas/ts-types";

export const auth = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<User>("/auth/login", credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  completeOnboarding: async (): Promise<void> => {
    await apiClient.patch("/auth/onboarding");
  },
};
