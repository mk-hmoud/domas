import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { MessagesService } from '../services/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';

@Controller('portal/messages')
@UseGuards(StudentAuthGuard)
export class PortalMessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  findMine(@Request() req: ExpressRequest) {
    return this.service.findMyConversation(req.session.studentId!);
  }

  @Get('unread-count')
  async unreadCount(@Request() req: ExpressRequest) {
    const count = await this.service.countUnreadForStudent(req.session.studentId!);
    return { count };
  }

  @Post()
  send(@Body() dto: SendMessageDto, @Request() req: ExpressRequest) {
    return this.service.sendAsStudent(req.session.studentId!, dto.body);
  }

  @Patch('read')
  markRead(@Request() req: ExpressRequest) {
    return this.service.markReadByStudent(req.session.studentId!);
  }
}
