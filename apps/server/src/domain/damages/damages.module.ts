import { Module, forwardRef } from '@nestjs/common';
import { DamagesService } from './services/damages.service';
import { DamagesController } from './controllers/damages.controller';
import { DamagesRepository } from './repositories/damages.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [InventoryModule, LocationsModule, forwardRef(() => AuditModule)],
  controllers: [DamagesController],
  providers: [DamagesService, DamagesRepository],
  exports: [DamagesService],
})
export class DamagesModule {}
