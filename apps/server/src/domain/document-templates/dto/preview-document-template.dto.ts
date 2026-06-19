import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '../constants/document-types';

export class PreviewDocumentTemplateDto {
  @IsIn(DOCUMENT_TYPE_VALUES)
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  htmlBody!: string;

  @IsString()
  @IsOptional()
  css?: string;
}
