import { Module } from '@nestjs/common';
import { DocumentTemplatesService } from './services/document-templates.service';
import { DocumentTemplatesController } from './controllers/document-templates.controller';
import { DocumentTemplatesRepository } from './repositories/document-templates.repository';

@Module({
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService, DocumentTemplatesRepository],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
