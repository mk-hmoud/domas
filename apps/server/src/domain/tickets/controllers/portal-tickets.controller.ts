import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
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
  createTicket(@Body() dto: CreateTicketDto, @Request() req: ExpressRequest) {
    return this.ticketsService.createTicket(req.session.studentId!, dto);
  }
}
