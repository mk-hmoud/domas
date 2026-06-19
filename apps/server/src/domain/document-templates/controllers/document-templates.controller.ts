import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentTemplatesService } from '../services/document-templates.service';
import { CreateDocumentTemplateDto } from '../dto/create-document-template.dto';
import { PreviewDocumentTemplateDto } from '../dto/preview-document-template.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('document-templates')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class DocumentTemplatesController {
  constructor(private readonly service: DocumentTemplatesService) {}

  @Get('types')
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_VIEW)
  listTypes() {
    return this.service.listTypes();
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_VIEW)
  findVersions(@Query('documentType') documentType: string) {
    return this.service.findVersions(documentType);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_VIEW)
  async findOne(@Param('id') id: string) {
    const template = await this.service.findById(id);
    if (!template) throw new NotFoundException('Template version not found');
    return template;
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_MANAGE)
  create(@Body() dto: CreateDocumentTemplateDto, @UserContext() ctx: AuditUserContext) {
    return this.service.create(dto, ctx.userId);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_MANAGE)
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post('preview')
  @RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_MANAGE)
  async preview(
    @Body() dto: PreviewDocumentTemplateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.preview(dto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="preview.pdf"',
    });
    return new StreamableFile(buffer);
  }
}
