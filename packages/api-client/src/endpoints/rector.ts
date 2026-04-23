import { apiClient } from "../client";
import { RectorBedsResponse, RectorResident } from "@domas/ts-types";

export const rector = {
  getBeds: async (): Promise<RectorBedsResponse> => {
    const response = await apiClient.get<RectorBedsResponse>("/rector/beds");
    return response.data;
  },

  getResidents: async (): Promise<RectorResident[]> => {
    const response = await apiClient.get<RectorResident[]>("/rector/residents");
    return response.data;
  },
};
