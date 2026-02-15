import { Module } from '@nestjs/common';
import { LocationsService } from './services/locations.service';
import { LocationsController } from './controllers/locations.controller';
import { LocationsRepository } from './repositories/locations.repository';
import { BedsController } from './controllers/beds.controller';
import { BedsService } from './services/beds.service';
import { BedsRepository } from './repositories/beds.repository';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [StudentsModule],
  controllers: [LocationsController, BedsController],
  providers: [LocationsService, LocationsRepository, BedsService, BedsRepository],
  exports: [LocationsService, BedsService, LocationsRepository, BedsRepository],
})
export class LocationsModule {}
