import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { PreReservationsService } from './services/pre-reservations.service';
import { PreReservationsRepository } from './repositories/pre-reservations.repository';
import { PreReservationsController } from './controllers/pre-reservations.controller';
import { PortalPreReservationsController } from './controllers/portal-pre-reservations.controller';

@Module({
  imports: [StudentsModule],
  controllers: [PreReservationsController, PortalPreReservationsController],
  providers: [PreReservationsService, PreReservationsRepository],
  exports: [PreReservationsService],
})
export class PreReservationsModule {}
