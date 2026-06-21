import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  DOCUMENT_LANGUAGE_VALUES,
  DOCUMENT_TYPE_VALUES,
  type DocumentLanguage,
  type DocumentType,
} from '../constants/document-types';

export class PreviewDocumentTemplateDto {
  @IsIn(DOCUMENT_TYPE_VALUES)
  documentType!: DocumentType;

  // Not used by the compiler (htmlBody/css are rendered as-is) - accepted so
  // the editor's request shape matches CreateDocumentTemplateDto.
  @IsIn(DOCUMENT_LANGUAGE_VALUES)
  @IsOptional()
  language?: DocumentLanguage;

  @IsString()
  @IsNotEmpty()
  htmlBody!: string;

  @IsString()
  @IsOptional()
  css?: string;
}
