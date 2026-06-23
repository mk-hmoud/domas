import { Module } from '@nestjs/common';
import { CountriesController } from './controllers/countries.controller';
import { CountriesService } from './services/countries.service';
import { CountriesRepository } from './repositories/countries.repository';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService, CountriesRepository],
  exports: [CountriesRepository],
})
export class CountriesModule {}
