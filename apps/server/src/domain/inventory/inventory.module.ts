import { Module, forwardRef } from '@nestjs/common';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryRepository } from './repositories/inventory.repository';
import { LocationsModule } from '../locations/locations.module';
import { AuditModule } from '../audit/audit.module';
import { StudentsModule } from '../students/students.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    LocationsModule,
    StudentsModule,
    forwardRef(() => BookingsModule),
    forwardRef(() => AuditModule),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
