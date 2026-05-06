import { apiClient } from "../client";
import { DocumentTemplate, UpdateDocumentTemplateDto } from "@domas/ts-types";

export const documentTemplates = {
  getAll: async (): Promise<DocumentTemplate[]> => {
    const response = await apiClient.get<DocumentTemplate[]>(
      "/document-templates",
    );
    return response.data;
  },

  getById: async (id: number): Promise<DocumentTemplate> => {
    const response = await apiClient.get<DocumentTemplate>(
      `/document-templates/${id}`,
    );
    return response.data;
  },

  update: async (
    id: number,
    dto: UpdateDocumentTemplateDto,
  ): Promise<DocumentTemplate> => {
    const response = await apiClient.patch<DocumentTemplate>(
      `/document-templates/${id}`,
      dto,
    );
    return response.data;
  },
};
