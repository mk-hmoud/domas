import { Module } from '@nestjs/common';
import { PreReservationsService } from './services/pre-reservations.service';
import { PreReservationsRepository } from './repositories/pre-reservations.repository';
import { PreReservationsController } from './controllers/pre-reservations.controller';
import { PortalPreReservationsController } from './controllers/portal-pre-reservations.controller';

@Module({
  controllers: [PreReservationsController, PortalPreReservationsController],
  providers: [PreReservationsService, PreReservationsRepository],
  exports: [PreReservationsService],
})
export class PreReservationsModule {}
