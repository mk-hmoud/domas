import { Controller, Get, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DocumentTemplatesService } from '../services/document-templates.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { UpdateDocumentTemplateDto } from '@domas/ts-types';

@Controller('document-templates')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.DOCUMENT_TEMPLATES_MANAGE)
export class DocumentTemplatesController {
  constructor(private readonly service: DocumentTemplatesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocumentTemplateDto) {
    return this.service.update(id, dto);
  }
}
