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
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('locations')
@UseGuards(AuthenticatedGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto, @UserContext() context: AuditUserContext) {
    return this.locationsService.create(createLocationDto, context);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.locationsService.findAll(pagination);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.locationsService.search(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findById(id);
  }

  @Get(':id/children')
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findChildren(id);
  }

  @Get(':id/ancestors')
  findWithAncestors(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findWithAncestors(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.locationsService.update(id, updateLocationDto, context);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.locationsService.delete(id, context);
  }
}
