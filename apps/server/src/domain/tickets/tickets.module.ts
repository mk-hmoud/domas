import { Module, forwardRef } from '@nestjs/common';
import { TicketsService } from './services/tickets.service';
import { TicketsRepository } from './repositories/tickets.repository';
import { TicketsController } from './controllers/tickets.controller';
import { PortalTicketsController } from './controllers/portal-tickets.controller';
import { StudentPortalModule } from '../student-portal/student-portal.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StudentPortalModule, forwardRef(() => WorkOrdersModule), NotificationsModule],
  controllers: [TicketsController, PortalTicketsController],
  providers: [TicketsService, TicketsRepository],
  exports: [TicketsService],
})
export class TicketsModule {}
