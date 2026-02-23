import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BedsService } from '../services/beds.service';
import { CreateBedDto } from '../dto/create-bed.dto';
import { UpdateBedDto } from '../dto/update-bed.dto';
import {
  UpdateBedTrOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedOwnershipDto,
} from '../dto/update-bed-policies.dto';
import { BulkCreateBedDto, BulkDeleteBedDto, BulkUpdateBedStatusDto } from '../dto/bulk-bed.dto';
import {
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedOwnershipDto,
} from '../dto/bulk-update-bed-policies.dto';
import { FindAllBedsDto } from '../dto/find-all-beds.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('beds')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get('eligible-beds')
  @RequirePermissions(PERMISSIONS.BOOKINGS_CREATE)
  async findEligibleBeds(@Query('studentId') studentId: string) {
    return this.bedsService.findEligibleBeds(studentId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.LOCATIONS_CREATE)
  create(@Body() createBedDto: CreateBedDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.create(createBedDto, context);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.LOCATIONS_CREATE)
  createMany(@Body() dto: BulkCreateBedDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.createMany(dto, context);
  }

  @Post('bulk-delete')
  @RequirePermissions(PERMISSIONS.LOCATIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMany(@Body() dto: BulkDeleteBedDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.deleteMany(dto, context);
  }

  @Patch('bulk-status')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateStatusMany(@Body() dto: BulkUpdateBedStatusDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.updateStatusMany(dto, context);
  }

  @Patch('bulk-tr-only')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateTrOnlyMany(@Body() dto: BulkUpdateBedTrOnlyDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.updateTrOnlyMany(dto, context);
  }

  @Patch('bulk-ownership')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateOwnershipMany(
    @Body() dto: BulkUpdateBedOwnershipDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateOwnershipMany(dto, context);
  }

  @Patch('bulk-guest-zone')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateGuestZoneMany(
    @Body() dto: BulkUpdateBedGuestZoneDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateGuestZoneMany(dto, context);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bedsService.findById(id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findAll(@Query() query: FindAllBedsDto) {
    const { locationId, status, ...pagination } = query;
    return this.bedsService.findAll(pagination, { locationId, status });
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBedDto: UpdateBedDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.update(id, updateBedDto, context);
  }

  @Patch(':id/tr-only')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  updateTrOnly(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBedTrOnlyDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateTrOnly(id, dto.isTrOnly, context);
  }

  @Patch(':id/ownership')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  updateOwnership(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBedOwnershipDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateOwnership(id, dto.ownership, context);
  }

  @Patch(':id/guest-zone')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  updateGuestZone(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBedGuestZoneDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateGuestZone(id, dto.isGuestZone, context);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.LOCATIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.bedsService.delete(id, context);
  }
}
