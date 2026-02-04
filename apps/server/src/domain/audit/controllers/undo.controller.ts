import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UndoService } from '../services/undo.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('audit/undo')
@UseGuards(AuthenticatedGuard)
export class UndoController {
  constructor(private readonly undoService: UndoService) {}

  @Get('recent')
  getRecent(@UserContext() context: AuditUserContext) {
    return this.undoService.findLatest(context);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  undo(@Param('id') id: string, @UserContext() context: AuditUserContext) {
    return this.undoService.undo(id, context);
  }
}
