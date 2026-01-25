import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { AccessService } from './services/access.service';
import { UsersController } from './controllers/users.controller';
import { AccessController } from './controllers/access.controller';
import { UsersRepository } from './repositories/users.repository';
import { AccessRepository } from './repositories/access.repository';

@Module({
  controllers: [UsersController, AccessController],
  providers: [UsersService, AccessService, UsersRepository, AccessRepository],
  exports: [UsersService, AccessService, UsersRepository, AccessRepository],
})
export class UsersModule {}
