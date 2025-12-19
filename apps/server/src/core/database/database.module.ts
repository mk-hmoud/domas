import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // Makes DatabaseService available everywhere without importing DatabaseModule
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
