import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DOCUMENT_TYPE_VALUES, type DocumentType } from '../constants/document-types';

export class CreateDocumentTemplateDto {
  @IsIn(DOCUMENT_TYPE_VALUES)
  documentType!: DocumentType;

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
