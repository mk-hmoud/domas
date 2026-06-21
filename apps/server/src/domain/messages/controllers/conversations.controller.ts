import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { AuthenticatedGuard } from '../../auth/guards/authenticated.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';
import { UserContext } from '../../../core/decorators/user-context.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import type { AuditUserContext } from '../../../common/interfaces/audit-user-context.interface';

@Controller('conversations')
@UseGuards(AuthenticatedGuard, PermissionsGuard)
export class ConversationsController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  findAll(@Query('status') status?: 'open' | 'closed', @Query('search') search?: string) {
    return this.service.findAllConversations({ status, search });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  findOne(@Param('id') id: string) {
    return this.service.findConversationById(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MESSAGES_MANAGE)
  start(@Body() dto: CreateConversationDto, @UserContext() ctx: AuditUserContext) {
    return this.service.startConversation(dto.studentId, dto.body, dto.subject, ctx.userId);
  }

  @Post(':id/messages')
  @RequirePermissions(PERMISSIONS.MESSAGES_MANAGE)
  reply(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @UserContext() ctx: AuditUserContext,
  ) {
    return this.service.replyAsAdmin(id, dto.body, ctx.userId);
  }

  @Patch(':id/read')
  @RequirePermissions(PERMISSIONS.MESSAGES_MANAGE)
  markRead(@Param('id') id: string) {
    return this.service.markReadByAdmin(id);
  }

  @Patch(':id/close')
  @RequirePermissions(PERMISSIONS.MESSAGES_MANAGE)
  close(@Param('id') id: string) {
    return this.service.closeConversation(id);
  }

  @Patch(':id/reopen')
  @RequirePermissions(PERMISSIONS.MESSAGES_MANAGE)
  reopen(@Param('id') id: string) {
    return this.service.reopenConversation(id);
  }
}
