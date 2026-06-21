export type DocumentType = "check_in" | "check_out" | "dorm_certificate";

export type DocumentLanguage = "en" | "tr";

export interface DocumentTemplate {
  id: string;
  documentType: DocumentType;
  language: DocumentLanguage;
  name: string;
  htmlBody: string;
  css: string;
  isActive: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface DocumentTypeInfo {
  documentType: DocumentType;
  label: string;
  fields: string[];
}
