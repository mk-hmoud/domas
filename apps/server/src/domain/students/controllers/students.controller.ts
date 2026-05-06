import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from '../services/students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { UpdateStudentStatusDto } from '../dto/update-student-status.dto';
import { BulkDeleteStudentsDto, BulkUpdateStudentStatusDto } from '../dto/bulk-student.dto';
import { FindAllStudentsDto } from '../dto/find-all-students.dto';
import { ResolveContactsDto } from '../dto/resolve-contacts.dto';
import { ReviewEnrollmentDto } from '../../student-portal/dto/review-enrollment.dto';
import { ReviewApplicationDto } from '../../student-portal/dto/review-application.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('students')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.STUDENTS_CREATE)
  create(@Body() createStudentDto: CreateStudentDto, @UserContext() context: AuditUserContext) {
    return this.studentsService.create(createStudentDto, context);
  }

  // ─── Applications — must be before :id routes ─────────────────────────────────

  @Get('applications')
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  listApplications(@Query('status') status?: string) {
    return this.studentsService.listApplications(status ? { status: status as any } : undefined);
  }

  @Patch('applications/:appId/review')
  @RequirePermissions(PERMISSIONS.STUDENTS_REVIEW_APPLICATIONS)
  reviewApplication(
    @Param('appId') appId: string,
    @Body() dto: ReviewApplicationDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.reviewApplication(
      appId,
      dto.action,
      context.userId,
      dto.rejectionReason,
    );
  }

  @Get('applications/:appId/letter-url')
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  getApplicationLetterUrl(@Param('appId') appId: string) {
    return this.studentsService.getApplicationLetterUrl(appId);
  }

  // ─── ─────────────────────────────────────────────────────────────────────────

  @Post('resolve-contacts')
  @RequirePermissions(PERMISSIONS.MESSAGING_SEND)
  resolveContacts(@Body() dto: ResolveContactsDto) {
    return this.studentsService.resolveContacts(dto);
  }

  @Post('bulk-delete')
  @RequirePermissions(PERMISSIONS.STUDENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMany(@Body() dto: BulkDeleteStudentsDto, @UserContext() context: AuditUserContext) {
    return this.studentsService.deleteMany(dto.ids, context);
  }

  @Patch('bulk-status')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateStatusMany(
    @Body() dto: BulkUpdateStudentStatusDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.updateStatusMany(dto.ids, dto.isActive, context);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.updateStatus(id, dto.isActive, context);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  findAll(@Query() query: FindAllStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.update(id, updateStudentDto, context);
  }

  @Post(':id/photo')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.studentsService.uploadPhoto(id, file);
  }

  @Delete(':id/photo')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePhoto(@Param('id') id: string) {
    return this.studentsService.deletePhoto(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STUDENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.studentsService.delete(id, context);
  }

  // ─── Enrollment ───────────────────────────────────────────────────────────────

  @Get(':id/enrollment')
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  getEnrollmentCerts(@Param('id') id: string) {
    return this.studentsService.getEnrollmentCerts(id);
  }

  @Patch(':id/enrollment/:certId/review')
  @RequirePermissions(PERMISSIONS.STUDENTS_UPDATE)
  reviewEnrollmentCert(
    @Param('id') id: string,
    @Param('certId') certId: string,
    @Body() dto: ReviewEnrollmentDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.studentsService.reviewEnrollmentCert(
      id,
      certId,
      dto.action,
      context.userId,
      dto.rejectionReason,
    );
  }

  @Get(':id/enrollment/:certId/url')
  @RequirePermissions(PERMISSIONS.STUDENTS_VIEW)
  getEnrollmentCertUrl(@Param('id') id: string, @Param('certId') certId: string) {
    return this.studentsService.getEnrollmentCertUrl(id, certId);
  }
}
