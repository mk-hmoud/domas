import { Module } from '@nestjs/common';
import { DocumentTemplatesService } from './services/document-templates.service';
import { DocumentTemplatesRepository } from './repositories/document-templates.repository';
import { DocumentTemplatesController } from './controllers/document-templates.controller';

@Module({
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService, DocumentTemplatesRepository],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
