import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { UndoService } from './services/undo.service';
import { AuditInfrastructureRepository } from './repositories/audit-infrastructure.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { UndoRepository } from './repositories/undo.repository';
import { AuditController } from './controllers/audit.controller';
import { UndoController } from './controllers/undo.controller';
import { UsersModule } from '../users/users.module';
import { LocationsModule } from '../locations/locations.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => LocationsModule),
    forwardRef(() => InventoryModule),
    NotificationsModule,
  ],
  controllers: [AuditController, UndoController],
  providers: [
    AuditService,
    UndoService,
    AuditInfrastructureRepository,
    AuditLogsRepository,
    UndoRepository,
  ],
  exports: [AuditService, UndoService],
})
export class AuditModule {}
