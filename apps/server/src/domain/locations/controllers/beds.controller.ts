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
  UpdateBedForeignerOnlyDto,
  UpdateBedGuestZoneDto,
  UpdateBedIsRectorateDto,
} from '../dto/update-bed-policies.dto';
import { BulkCreateBedDto, BulkDeleteBedDto, BulkUpdateBedStatusDto } from '../dto/bulk-bed.dto';
import {
  BulkUpdateBedTrOnlyDto,
  BulkUpdateBedForeignerOnlyDto,
  BulkUpdateBedGuestZoneDto,
  BulkUpdateBedIsRectorateDto,
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

  @Patch('bulk-foreigner-only')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateForeignerOnlyMany(
    @Body() dto: BulkUpdateBedForeignerOnlyDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateForeignerOnlyMany(dto, context);
  }

  @Patch('bulk-rectorate')
  @RequirePermissions(PERMISSIONS.LOCATIONS_RECTORATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateIsRectorateMany(
    @Body() dto: BulkUpdateBedIsRectorateDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateIsRectorateMany(dto, context);
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
  findOne(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.bedsService.findById(id, context);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.LOCATIONS_VIEW)
  findAll(@Query() query: FindAllBedsDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.findAll(query, context);
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

  @Patch(':id/foreigner-only')
  @RequirePermissions(PERMISSIONS.LOCATIONS_UPDATE)
  updateForeignerOnly(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBedForeignerOnlyDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateForeignerOnly(id, dto.isForeignerOnly, context);
  }

  @Patch(':id/rectorate')
  @RequirePermissions(PERMISSIONS.LOCATIONS_RECTORATE)
  updateIsRectorate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBedIsRectorateDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.updateIsRectorate(id, dto.isRectorate, context);
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
