import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from '../services/students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('students')
@UseGuards(AuthenticatedGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto, @UserContext() context: AuditUserContext) {
    return this.studentsService.create(createStudentDto, context);
  }

  @Get()
  findAll(@Query() query: FindAllStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.update(id, updateStudentDto, context);
  }
}
