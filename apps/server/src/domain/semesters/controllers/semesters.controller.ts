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
import { SemestersService } from '../services/semesters.service';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { FindAllSemestersDto } from '../dto/find-all-semesters.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

@Controller('semesters')
@UseGuards(AuthenticatedGuard)
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto, @UserContext() context: AuditUserContext) {
    return this.semestersService.create(createSemesterDto, context);
  }

  @Get()
  findAll(@Query() query: FindAllSemestersDto) {
    return this.semestersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.semestersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSemesterDto: UpdateSemesterDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.semestersService.update(id, updateSemesterDto, context);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.semestersService.updateStatus(id, dto.status, context);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.semestersService.delete(id, context);
  }
}
