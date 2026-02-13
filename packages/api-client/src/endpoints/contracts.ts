import { apiClient } from "../client";

export const contracts = {
  downloadContract: async (bookingId: string): Promise<void> => {
    const response = await apiClient.get(`/contracts/${bookingId}`, {
      responseType: "blob",
    });

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contract-${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
