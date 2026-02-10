import { Module } from '@nestjs/common';
import { AccessCardsService } from './services/access-cards.service';
import { AccessCardsController } from './controllers/access-cards.controller';
import { AccessCardsRepository } from './repositories/access-cards.repository';

@Module({
  controllers: [AccessCardsController],
  providers: [AccessCardsService, AccessCardsRepository],
  exports: [AccessCardsService, AccessCardsRepository],
})
export class AccessCardsModule {}
