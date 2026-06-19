import { Global, Module } from '@nestjs/common';
import { PdfRendererService } from './pdf-renderer.service';
import { TemplateCompilerService } from './template-compiler.service';

@Global()
@Module({
  providers: [PdfRendererService, TemplateCompilerService],
  exports: [PdfRendererService, TemplateCompilerService],
})
export class PdfRenderingModule {}
