import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AccessCardsService } from '../services/access-cards.service';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';
import { CreateCardBatchDto } from '../dto/create-card-batch.dto';
import { IssueCardDto } from '../dto/issue-card.dto';
import { ReturnCardDto } from '../dto/return-card.dto';
import { UpdateCardStatusDto } from '../dto/update-card-status.dto';
import { CardStatus } from '../../../common/enums/card-status.enum';

@Controller('access-cards')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class AccessCardsController {
  constructor(private readonly service: AccessCardsService) {}

  @Post('batches')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_MANAGE)
  createBatch(@Body() data: CreateCardBatchDto, @UserContext() context: AuditUserContext) {
    return this.service.createBatch(data, context);
  }

  @Get('batches')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_VIEW)
  findAllBatches(@UserContext() context: AuditUserContext) {
    return this.service.findAllBatches(context);
  }

  @Get('cards')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_VIEW)
  findAllCards(
    @UserContext() context: AuditUserContext,
    @Query('batchId') batchId?: string,
    @Query('status') status?: CardStatus,
  ) {
    return this.service.findAllCards(
      {
        batchId: batchId ? parseInt(batchId, 10) : undefined,
        status,
      },
      context,
    );
  }

  @Post('issue')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_MANAGE)
  issueCard(@Body() data: IssueCardDto, @UserContext() context: AuditUserContext) {
    return this.service.issueCard(data, context);
  }

  @Post('cards/:id/return')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_MANAGE)
  returnCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReturnCardDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.returnCard(id, data, context);
  }

  @Patch('cards/:id/status')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_MANAGE)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCardStatusDto,
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.updateStatus(id, data, context);
  }

  @Post('cards/:id/reinstate')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_REINSTATE)
  reinstateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { notes?: string },
    @UserContext() context: AuditUserContext,
  ) {
    return this.service.reinstateCard(id, data, context);
  }

  @Get('cards/:id/logs')
  @RequirePermissions(PERMISSIONS.ACCESS_CARDS_VIEW)
  getLogs(@Param('id', ParseIntPipe) id: number, @UserContext() context: AuditUserContext) {
    return this.service.getLogs(id, context);
  }
}
