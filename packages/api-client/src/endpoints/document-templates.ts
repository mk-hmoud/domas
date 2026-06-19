import { apiClient } from "../client";
import {
  DocumentTemplate,
  DocumentTypeInfo,
  CreateDocumentTemplateDto,
  PreviewDocumentTemplateDto,
} from "@domas/ts-types";

export const documentTemplates = {
  listTypes: async (): Promise<DocumentTypeInfo[]> => {
    const response = await apiClient.get<DocumentTypeInfo[]>(
      "/document-templates/types",
    );
    return response.data;
  },

  findVersions: async (documentType: string): Promise<DocumentTemplate[]> => {
    const response = await apiClient.get<DocumentTemplate[]>(
      "/document-templates",
      {
        params: { documentType },
      },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<DocumentTemplate> => {
    const response = await apiClient.get<DocumentTemplate>(
      `/document-templates/${id}`,
    );
    return response.data;
  },

  create: async (dto: CreateDocumentTemplateDto): Promise<DocumentTemplate> => {
    const response = await apiClient.post<DocumentTemplate>(
      "/document-templates",
      dto,
    );
    return response.data;
  },

  publish: async (id: string): Promise<DocumentTemplate> => {
    const response = await apiClient.post<DocumentTemplate>(
      `/document-templates/${id}/publish`,
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/document-templates/${id}`);
  },

  preview: async (dto: PreviewDocumentTemplateDto): Promise<Blob> => {
    const response = await apiClient.post("/document-templates/preview", dto, {
      responseType: "blob",
    });
    return response.data;
  },
};
