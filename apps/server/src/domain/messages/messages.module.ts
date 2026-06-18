import { Module } from '@nestjs/common';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesService } from './services/messages.service';
import { ConversationsController } from './controllers/conversations.controller';
import { PortalMessagesController } from './controllers/portal-messages.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [ConversationsController, PortalMessagesController],
  providers: [MessagesService, ConversationsRepository],
})
export class MessagesModule {}
