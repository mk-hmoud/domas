import { Module, forwardRef } from '@nestjs/common';
import { ContractsService } from './services/contracts.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsRepository } from './repositories/contracts.repository';
import { BookingsModule } from '../bookings/bookings.module';
import { StudentsModule } from '../students/students.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [forwardRef(() => BookingsModule), StudentsModule, InventoryModule, LocationsModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractsRepository],
  exports: [ContractsService],
})
export class ContractsModule {}
