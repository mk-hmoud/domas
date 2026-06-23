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
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto/department.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  // Public - the unauthenticated student application/registration form needs
  // the full list to populate its department dropdown.
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Patch(':nameEn')
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  update(@Param('nameEn') nameEn: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(nameEn, dto);
  }

  @Delete(':nameEn')
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('nameEn') nameEn: string) {
    return this.service.delete(nameEn);
  }
}
