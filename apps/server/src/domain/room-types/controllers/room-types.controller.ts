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
} from '@nestjs/common';
import { RoomTypesService } from '../services/room-types.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dto/room-type.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';

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
  create(@Body() dto: CreateRoomTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoomTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
