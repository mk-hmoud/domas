import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { AccessRepository } from './repositories/access.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AccessRepository],
  exports: [UsersService, UsersRepository, AccessRepository],
})
export class UsersModule {}
