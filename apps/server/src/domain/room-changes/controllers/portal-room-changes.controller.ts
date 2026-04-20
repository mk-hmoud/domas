import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';
import { RoomChangesService } from '../services/room-changes.service';
import { StudentCreateRoomChangeDto } from '../dto/student-create-room-change.dto';

@UseGuards(StudentAuthGuard)
@Controller('portal/room-changes')
export class PortalRoomChangesController {
  constructor(private readonly roomChangesService: RoomChangesService) {}

  @Get()
  getMyRequests(@Request() req: ExpressRequest) {
    return this.roomChangesService.getMyRequests(req.session.studentId!);
  }

  @Post(':semesterId')
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Param('semesterId', ParseIntPipe) semesterId: number,
    @Body() dto: StudentCreateRoomChangeDto,
    @Request() req: ExpressRequest,
  ) {
    return this.roomChangesService.createRequest(req.session.studentId!, semesterId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelRequest(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.roomChangesService.cancelRequest(id, req.session.studentId!);
  }
}
