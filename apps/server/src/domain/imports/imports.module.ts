import { Module } from '@nestjs/common';
import { ImportsService } from './services/imports.service';
import { ImportsController } from './controllers/imports.controller';
import { StudentsModule } from '../students/students.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LocationsModule } from '../locations/locations.module';
import { SemestersModule } from '../semesters/semesters.module';
import { AuditModule } from '../audit/audit.module';
import { StudentsRepository } from '../students/repositories/students.repository';
import { BedsRepository } from '../locations/repositories/beds.repository';
import { SemestersRepository } from '../semesters/repositories/semesters.repository';
import { ImportsRepository } from './repositories/imports.repository';

@Module({
  imports: [StudentsModule, BookingsModule, LocationsModule, SemestersModule, AuditModule],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    ImportsRepository,
    StudentsRepository,
    BedsRepository,
    SemestersRepository,
  ],
  exports: [ImportsService, ImportsRepository],
})
export class ImportsModule {}
