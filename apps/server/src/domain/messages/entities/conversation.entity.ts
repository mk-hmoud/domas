import { ConversationMessage } from './conversation-message.entity';

export class Conversation {
  id!: string;
  studentId!: string;
  studentName!: string;
  studentNumber!: string;
  subject?: string;
  status!: 'open' | 'closed';
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadByAdmin!: boolean;
  unreadByStudent!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  messages?: ConversationMessage[];
  canReopen!: boolean;

  constructor(partial: Partial<Conversation>) {
    Object.assign(this, partial);
  }
}
