import axios from "axios";

const apiUrl =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
