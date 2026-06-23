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
import { CountriesService } from '../services/countries.service';
import { CreateCountryDto, UpdateCountryDto } from '../dto/country.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';

@Controller('countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  // Public - the unauthenticated student application/registration form needs
  // the full list to populate its nationality dropdown.
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Patch(':code')
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  update(@Param('code') code: string, @Body() dto: UpdateCountryDto) {
    return this.service.update(code, dto);
  }

  @Delete(':code')
  @UseGuards(AuthenticatedGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.LOOKUPS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('code') code: string) {
    return this.service.delete(code);
  }
}
