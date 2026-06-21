import { Module, forwardRef } from '@nestjs/common';
import { WorkOrdersService } from './services/work-orders.service';
import { WorkOrdersRepository } from './repositories/work-orders.repository';
import { WorkOrdersController } from './controllers/work-orders.controller';
import { LocationsModule } from '../locations/locations.module';
import { UsersModule } from '../users/users.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    forwardRef(() => LocationsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TicketsModule),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrdersRepository],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
