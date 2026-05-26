import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { StudentAuthGuard } from '../../../common/guards/student-auth.guard';
import { PreReservationsService } from '../services/pre-reservations.service';
import { CreatePreReservationDto } from '../dto/create-pre-reservation.dto';

@UseGuards(StudentAuthGuard)
@Controller('portal/pre-reservations')
export class PortalPreReservationsController {
  constructor(private readonly preReservationsService: PreReservationsService) {}

  @Get()
  getMyPreReservations(@Request() req: ExpressRequest) {
    return this.preReservationsService.getMyPreReservations(req.session.studentId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePreReservationDto, @Request() req: ExpressRequest) {
    return this.preReservationsService.create(req.session.studentId!, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.preReservationsService.cancel(id, req.session.studentId!);
  }
}
