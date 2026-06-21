import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentTemplatesRepository } from '../repositories/document-templates.repository';
import { TemplateCompilerService } from '../../../common/pdf-rendering/template-compiler.service';
import { PdfRendererService } from '../../../common/pdf-rendering/pdf-renderer.service';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { PreviewDocumentTemplateDto } from '../dto/preview-document-template.dto';
import { DocumentTemplate } from '../entities/document-template.entity';
import {
  DOCUMENT_TYPE_FIELDS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_SAMPLE_CONTEXT,
  DOCUMENT_TYPE_VALUES,
  DocumentType,
} from '../constants/document-types';

@Injectable()
export class DocumentTemplatesService {
  constructor(
    private readonly repository: DocumentTemplatesRepository,
    private readonly compiler: TemplateCompilerService,
    private readonly renderer: PdfRendererService,
  ) {}

  listTypes() {
    return DOCUMENT_TYPE_VALUES.map((documentType) => ({
      documentType,
      label: DOCUMENT_TYPE_LABELS[documentType],
      fields: DOCUMENT_TYPE_FIELDS[documentType],
    }));
  }

  findVersions(documentType: string, language: string): Promise<DocumentTemplate[]> {
    return this.repository.findVersions(documentType, language);
  }

  findById(id: string): Promise<DocumentTemplate | null> {
    return this.repository.findById(id);
  }

  /** Used by ContractsService/DormCertificatesService to decide whether to
   * render via the template engine or fall back to the built-in generator. */
  findActiveByType(documentType: string, language: string): Promise<DocumentTemplate | null> {
    return this.repository.findActiveByType(documentType, language);
  }

  create(dto: CreateDocumentTemplateDto, userId: string): Promise<DocumentTemplate> {
    return this.repository.create(
      {
        documentType: dto.documentType,
        language: dto.language,
        name: dto.name,
        htmlBody: dto.htmlBody,
        css: dto.css ?? '',
      },
      userId,
    );
  }

  publish(id: string): Promise<DocumentTemplate> {
    return this.repository.publish(id);
  }

  async unpublish(documentType: string, language: string): Promise<void> {
    return this.repository.unpublish(documentType, language);
  }

  async delete(id: string): Promise<void> {
    const template = await this.repository.findById(id);
    if (template?.isActive) {
      throw new BadRequestException(
        'Cannot delete the published version of a template. Publish a different version first.',
      );
    }
    await this.repository.delete(id);
  }

  /** Renders htmlBody/css against a synthetic sample context for the given
   * document type, so the editor can show a live preview before saving. */
  async preview(dto: PreviewDocumentTemplateDto): Promise<Buffer> {
    const sampleContext = DOCUMENT_TYPE_SAMPLE_CONTEXT[dto.documentType as DocumentType];
    const html = this.compiler.compile(dto.htmlBody, dto.css ?? '', sampleContext);
    return this.renderer.renderHtmlToPdf(html);
  }

  /** Renders a published template against a real data context. Used by the
   * owning domain services (contracts, dorm certificates) once a template
   * has been published for their document type. */
  async render(template: DocumentTemplate, context: Record<string, unknown>): Promise<Buffer> {
    const html = this.compiler.compile(template.htmlBody, template.css, context);
    return this.renderer.renderHtmlToPdf(html);
  }
}
