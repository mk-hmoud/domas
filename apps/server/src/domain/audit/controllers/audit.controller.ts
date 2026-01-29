import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { SearchAuditDto } from '../dto/search-audit.dto';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('audit')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('search')
  @RequirePermissions(PERMISSIONS.AUDIT_VIEW)
  search(@Body() dto: SearchAuditDto, @UserContext() context: AuditUserContext) {
    return this.auditService.search(dto, context);
  }

  @Get('recent-changes')
  getRecentChanges(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.auditService.getRecentChanges(limit);
  }

  @Get('suspicious-activity')
  getSuspiciousActivity() {
    return this.auditService.getSuspiciousActivity();
  }

  @Get('bulk-operations')
  getBulkOperations(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.auditService.getBulkOperations(limit);
  }
}
