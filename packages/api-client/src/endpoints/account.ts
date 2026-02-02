import { apiClient } from "../client";
import { User, UpdateProfileDto, ChangePasswordDto } from "@domas/ts-types";

export const account = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/account/profile");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<void> => {
    await apiClient.patch("/account/profile", data);
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.patch("/account/password", data);
  },
};
