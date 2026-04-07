import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './services/bookings.service';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsRepository } from './repositories/bookings.repository';
import { LocationsModule } from '../locations/locations.module';
import { StudentsModule } from '../students/students.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccessCardsModule } from '../access-cards/access-cards.module';
import { ContractsModule } from '../contracts/contracts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    LocationsModule,
    StudentsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuditModule),
    forwardRef(() => InventoryModule),
    AccessCardsModule,
    forwardRef(() => ContractsModule),
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
