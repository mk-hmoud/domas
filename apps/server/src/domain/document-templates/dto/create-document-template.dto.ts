import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DOCUMENT_LANGUAGE_VALUES,
  DOCUMENT_TYPE_VALUES,
  type DocumentLanguage,
  type DocumentType,
} from '../constants/document-types';

export class CreateDocumentTemplateDto {
  @IsIn(DOCUMENT_TYPE_VALUES)
  documentType!: DocumentType;

  @IsIn(DOCUMENT_LANGUAGE_VALUES)
  language!: DocumentLanguage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  htmlBody!: string;

  @IsString()
  @IsOptional()
  css?: string;
}
