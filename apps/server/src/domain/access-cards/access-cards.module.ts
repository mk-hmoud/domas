import { Module } from '@nestjs/common';
import { AccessCardsService } from './services/access-cards.service';
import { AccessCardsController } from './controllers/access-cards.controller';
import { AccessCardsRepository } from './repositories/access-cards.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AccessCardsController],
  providers: [AccessCardsService, AccessCardsRepository],
  exports: [AccessCardsService, AccessCardsRepository],
})
export class AccessCardsModule {}
