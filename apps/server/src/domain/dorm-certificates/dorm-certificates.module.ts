import { Module, forwardRef } from '@nestjs/common';
import { StudentsModule } from '../students/students.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LocationsModule } from '../locations/locations.module';
import { AuditModule } from '../audit/audit.module';
import { DormCertificatesService } from './services/dorm-certificates.service';
import { DormCertificatesController } from './controllers/dorm-certificates.controller';
import { PortalDormCertificatesController } from './controllers/portal-dorm-certificates.controller';
import { DormCertificatesRepository } from './repositories/dorm-certificates.repository';

@Module({
  imports: [StudentsModule, BookingsModule, LocationsModule, forwardRef(() => AuditModule)],
  controllers: [DormCertificatesController, PortalDormCertificatesController],
  providers: [DormCertificatesService, DormCertificatesRepository],
})
export class DormCertificatesModule {}
