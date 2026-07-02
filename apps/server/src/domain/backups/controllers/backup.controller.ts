import { Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { BackupService } from '../services/backup.service';

@Controller('backups')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BACKUPS_VIEW)
  list() {
    return this.backupService.listBackups();
  }

  @Post('create')
  @RequirePermissions(PERMISSIONS.BACKUPS_MANAGE)
  create() {
    return this.backupService.createBackup();
  }

  @Get('download/:name')
  @RequirePermissions(PERMISSIONS.BACKUPS_VIEW)
  download(@Param('name') name: string, @Res() res: Response) {
    const filePath = this.backupService.getBackupFilePath(name);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    fs.createReadStream(filePath).pipe(res);
  }

  @Delete(':name')
  @RequirePermissions(PERMISSIONS.BACKUPS_MANAGE)
  delete(@Param('name') name: string) {
    this.backupService.deleteBackup(name);
    return { success: true };
  }
}
