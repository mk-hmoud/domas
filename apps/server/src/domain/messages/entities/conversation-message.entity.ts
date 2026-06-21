export class ConversationMessage {
  id!: string;
  conversationId!: string;
  senderType!: 'student' | 'user';
  senderId!: string;
  senderName?: string;
  body!: string;
  readAt?: Date;
  createdAt!: Date;

  constructor(partial: Partial<ConversationMessage>) {
    Object.assign(this, partial);
  }
}
