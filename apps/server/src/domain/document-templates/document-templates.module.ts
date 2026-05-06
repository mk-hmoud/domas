import { Module } from '@nestjs/common';
import { DocumentTemplatesService } from './services/document-templates.service';
import { DocumentTemplatesRepository } from './repositories/document-templates.repository';

@Module({
  providers: [DocumentTemplatesService, DocumentTemplatesRepository],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
