import { Module } from '@nestjs/common';
import { StatsService } from './services/stats.service';
import { StatsController } from './controllers/stats.controller';

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
