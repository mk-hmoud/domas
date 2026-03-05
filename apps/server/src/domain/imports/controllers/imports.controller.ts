import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from '../services/imports.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { BulkImportStudentsDto } from '../dto/bulk-import.dto';

@Controller('imports')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.STUDENTS_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('dryRun') dryRun: string,
    @Body('updateExisting') updateExisting: string,
    @UserContext() context: AuditUserContext,
  ) {
    // Note: Multipart fields are sent as strings
    const isDryRun = dryRun === 'true';
    const isUpdateExisting = updateExisting === 'true';

    return this.importsService.bulkImport(
      {
        fileBuffer: file.buffer,
        filename: file.originalname,
        dryRun: isDryRun,
        updateExisting: isUpdateExisting,
      },
      context,
    );
  }
}
