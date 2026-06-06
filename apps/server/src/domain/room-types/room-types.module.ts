import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RoomTypesController } from './controllers/room-types.controller';
import { RoomTypesService } from './services/room-types.service';
import { RoomTypesRepository } from './repositories/room-types.repository';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [RoomTypesController],
  providers: [RoomTypesService, RoomTypesRepository],
  exports: [RoomTypesService, RoomTypesRepository],
})
export class RoomTypesModule {}
