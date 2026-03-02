import { Module, forwardRef } from '@nestjs/common';
import { AccessCardsService } from './services/access-cards.service';
import { AccessCardsController } from './controllers/access-cards.controller';
import { AccessCardsRepository } from './repositories/access-cards.repository';
import { AuditModule } from '../audit/audit.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [forwardRef(() => AuditModule), LocationsModule],
  controllers: [AccessCardsController],
  providers: [AccessCardsService, AccessCardsRepository],
  exports: [AccessCardsService, AccessCardsRepository],
})
export class AccessCardsModule {}
