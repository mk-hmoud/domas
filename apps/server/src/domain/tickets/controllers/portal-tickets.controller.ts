import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';

@UseGuards(StudentAuthGuard)
@Controller('portal/tickets')
export class PortalTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  getMyTickets(@Request() req: ExpressRequest) {
    return this.ticketsService.getMyTickets(req.session.studentId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('photos', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
  createTicket(
    @Body() dto: CreateTicketDto,
    @UploadedFiles() photos: Express.Multer.File[] = [],
    @Request() req: ExpressRequest,
  ) {
    return this.ticketsService.createTicket(req.session.studentId!, dto, photos);
  }
}
