import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LocationsService } from '../services/locations.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import {
  BulkCreateLocationDto,
  BulkUpdateLocationDto,
  BulkDeleteLocationDto,
} from '../dto/bulk-location.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('locations')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.LOCATIONS_CREATE)
  create(@Body() createLocationDto: CreateLocationDto, @UserContext() context: AuditUserContext) {
    return this.locationsService.create(createLocationDto, context);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.LOCATIONS_CREATE)
  createMany(@Body() dto: BulkCreateLocationDto, @UserContext() context: AuditUserContext) {
    return this.locationsService.createMany(dto, context);
  }

  @Patch('bulk')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateMany(@Body() dto: BulkUpdateLocationDto, @UserContext() context: AuditUserContext) {
    return this.locationsService.updateMany(dto, context);
  }

  @Post('bulk-delete')
  @RequirePermissions(PERMISSIONS.LOCATIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMany(@Body() dto: BulkDeleteLocationDto, @UserContext() context: AuditUserContext) {
    return this.locationsService.deleteMany(dto, context);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findAll(@Query() pagination: PaginationDto) {
    return this.locationsService.findAll(pagination);
  }

  @Get('search')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  search(@Query('q') query: string) {
    return this.locationsService.search(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findById(id);
  }

  @Get(':id/children')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findChildren(id);
  }

  @Get(':id/ancestors')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findWithAncestors(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findWithAncestors(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.locationsService.update(id, updateLocationDto, context);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.locationsService.delete(id, context);
  }
}
