import { DocumentType } from "../interfaces/document-template.interface";

export interface CreateDocumentTemplateDto {
  documentType: DocumentType;
  name: string;
  htmlBody: string;
  css?: string;
}

export interface PreviewDocumentTemplateDto {
  documentType: DocumentType;
  htmlBody: string;
  css?: string;
}
