import { Module } from '@nestjs/common';
import { RoomTypesController } from './controllers/room-types.controller';
import { RoomTypesService } from './services/room-types.service';
import { RoomTypesRepository } from './repositories/room-types.repository';

@Module({
  controllers: [RoomTypesController],
  providers: [RoomTypesService, RoomTypesRepository],
  exports: [RoomTypesService, RoomTypesRepository],
})
export class RoomTypesModule {}
