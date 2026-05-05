import axios from "axios";

const apiUrl =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      const value = params[key];
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    }
    return searchParams.toString();
  },
});
