import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from '../services/announcements.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('announcements')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  create(@Body() dto: CreateAnnouncementDto, @UserContext() ctx: AuditUserContext) {
    return this.service.create(dto, ctx.userId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Post(':id/unpublish')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  unpublish(@Param('id') id: string) {
    return this.service.unpublish(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
