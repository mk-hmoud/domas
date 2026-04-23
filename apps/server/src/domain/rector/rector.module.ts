import { Module } from '@nestjs/common';
import { RectorService } from './rector.service';
import { RectorController } from './rector.controller';

@Module({
  controllers: [RectorController],
  providers: [RectorService],
})
export class RectorModule {}
