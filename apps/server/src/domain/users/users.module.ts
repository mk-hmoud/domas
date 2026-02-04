import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { AccessService } from './services/access.service';
import { AccountService } from './services/account.service';
import { UsersController } from './controllers/users.controller';
import { AccessController } from './controllers/access.controller';
import { AccountController } from './controllers/account.controller';
import { UsersRepository } from './repositories/users.repository';
import { AccessRepository } from './repositories/access.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [forwardRef(() => AuditModule)],
  controllers: [UsersController, AccessController, AccountController],
  providers: [UsersService, AccessService, AccountService, UsersRepository, AccessRepository],
  exports: [UsersService, AccessService, UsersRepository, AccessRepository],
})
export class UsersModule {}
