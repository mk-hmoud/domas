import { Module, forwardRef } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { AuditModule } from '../audit/audit.module';
import { PreReservationsService } from './services/pre-reservations.service';
import { PreReservationsRepository } from './repositories/pre-reservations.repository';
import { PreReservationsController } from './controllers/pre-reservations.controller';
import { PortalPreReservationsController } from './controllers/portal-pre-reservations.controller';

@Module({
  imports: [StudentsModule, forwardRef(() => AuditModule)],
  controllers: [PreReservationsController, PortalPreReservationsController],
  providers: [PreReservationsService, PreReservationsRepository],
  exports: [PreReservationsService],
})
export class PreReservationsModule {}
