import { apiClient } from "../client";
import { ImportResultDto } from "@domas/ts-types";

export const imports = {
  bulkImport: async (data: {
    file: File;
    dryRun: boolean;
    updateExisting: boolean;
  }): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("dryRun", String(data.dryRun));
    formData.append("updateExisting", String(data.updateExisting));

    const response = await apiClient.post<ImportResultDto>(
      "/imports/bulk",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
