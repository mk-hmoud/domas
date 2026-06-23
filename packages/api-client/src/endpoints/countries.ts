import { apiClient } from "../client";
import { Country, CreateCountryDto, UpdateCountryDto } from "@domas/ts-types";

export const countries = {
  findAll: async (): Promise<Country[]> => {
    const response = await apiClient.get<Country[]>("/countries");
    return response.data;
  },

  create: async (data: CreateCountryDto): Promise<Country> => {
    const response = await apiClient.post<Country>("/countries", data);
    return response.data;
  },

  update: async (code: string, data: UpdateCountryDto): Promise<Country> => {
    const response = await apiClient.patch<Country>(
      `/countries/${encodeURIComponent(code)}`,
      data,
    );
    return response.data;
  },

  delete: async (code: string): Promise<void> => {
    await apiClient.delete(`/countries/${encodeURIComponent(code)}`);
  },
};
