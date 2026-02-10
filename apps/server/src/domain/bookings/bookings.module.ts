import { Module } from '@nestjs/common';
import { BookingsService } from './services/bookings.service';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsRepository } from './repositories/bookings.repository';
import { LocationsModule } from '../locations/locations.module';
import { StudentsModule } from '../students/students.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccessCardsModule } from '../access-cards/access-cards.module';

@Module({
  imports: [
    LocationsModule,
    StudentsModule,
    UsersModule,
    AuditModule,
    InventoryModule,
    AccessCardsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
