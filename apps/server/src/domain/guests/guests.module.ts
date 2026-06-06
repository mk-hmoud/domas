import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GuestsRepository } from './repositories/guests.repository';
import { GuestStaysRepository } from './repositories/guest-stays.repository';
import { GuestsService } from './services/guests.service';
import { GuestsController } from './controllers/guests.controller';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [GuestsController],
  providers: [GuestsService, GuestsRepository, GuestStaysRepository],
  exports: [GuestStaysRepository],
})
export class GuestsModule {}
