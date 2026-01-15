import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { SearchAuditDto } from '../dto/search-audit.dto';

@Controller('audit')
@UseGuards(AuthenticatedGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('search')
  search(@Body() dto: SearchAuditDto) {
    return this.auditService.search(dto);
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
