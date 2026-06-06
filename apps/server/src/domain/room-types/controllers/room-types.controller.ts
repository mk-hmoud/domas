import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoomTypesService } from '../services/room-types.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { PERMISSIONS } from '../../../common/constants/permissions';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('room-types')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class RoomTypesController {
  constructor(private readonly service: RoomTypesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  create(@Body() dto: CreateRoomTypeDto, @UserContext() ctx: AuditUserContext) {
    return this.service.create(dto, ctx.userId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
    @UserContext() ctx: AuditUserContext,
  ) {
    return this.service.update(id, dto, ctx.userId);
  }

  @Post(':id/images')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_SIZE } }))
  uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadImage(id, file);
  }

  @Delete(':id/images/:index')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  removeImage(@Param('id', ParseIntPipe) id: number, @Param('index', ParseIntPipe) index: number) {
    return this.service.removeImage(id, index);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number, @UserContext() ctx: AuditUserContext) {
    return this.service.delete(id, ctx.userId);
  }
}
