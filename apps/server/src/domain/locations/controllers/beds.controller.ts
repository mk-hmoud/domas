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
import { FindAllBedsDto } from '../dto/find-all-beds.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('beds')
@UseGuards(AuthenticatedGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post()
  create(@Body() createBedDto: CreateBedDto, @UserContext() context: AuditUserContext) {
    return this.bedsService.create(createBedDto, context);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bedsService.findById(id);
  }

  @Get()
  findAll(@Query() query: FindAllBedsDto) {
    const { locationId, status, ...pagination } = query;
    return this.bedsService.findAll(pagination, { locationId, status });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBedDto: UpdateBedDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.bedsService.update(id, updateBedDto, context);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.bedsService.delete(id, context);
  }
}
