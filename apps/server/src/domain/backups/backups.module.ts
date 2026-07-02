import { Module } from '@nestjs/common';
import { BackupService } from './services/backup.service';
import { BackupController } from './controllers/backup.controller';

@Module({
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupsModule {}
