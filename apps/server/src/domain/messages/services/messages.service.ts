import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationsRepository } from '../repositories/conversations.repository';
import { RealtimeService } from '../../realtime/realtime.service';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';

@Injectable()
export class MessagesService {
  constructor(
    private readonly repo: ConversationsRepository,
    private readonly realtime: RealtimeService,
  ) {}

  // ─── Admin ──────────────────────────────────────────────────────────────────

  findAllConversations(filter?: {
    status?: 'open' | 'closed';
    search?: string;
  }): Promise<Conversation[]> {
    return this.repo.findAllForAdmin(filter);
  }

  async findConversationById(id: string): Promise<Conversation> {
    const conversation = await this.repo.findByIdForAdmin(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async startConversation(
    studentId: string,
    body: string,
    subject: string | undefined,
    adminUserId: string,
  ): Promise<Conversation> {
    const { conversationId } = await this.repo.createConversation(
      studentId,
      subject,
      'user',
      adminUserId,
      body,
    );
    const conversation = await this.repo.findByIdForAdmin(conversationId);
    const message = conversation?.messages?.[conversation.messages.length - 1];
    if (message) {
      this.realtime.publish(studentId, 'message', message);
    }
    return conversation as Conversation;
  }

  async replyAsAdmin(
    conversationId: string,
    body: string,
    adminUserId: string,
  ): Promise<ConversationMessage> {
    const existing = await this.repo.findByIdForAdmin(conversationId);
    if (!existing) throw new NotFoundException('Conversation not found');
    await this.repo.appendMessage(conversationId, 'user', adminUserId, body);
    const messages = await this.repo.findMessages(conversationId);
    const message = messages[messages.length - 1];
    this.realtime.publish(existing.studentId, 'message', message);
    return message;
  }

  async markReadByAdmin(conversationId: string): Promise<void> {
    const existing = await this.repo.findByIdForAdmin(conversationId);
    if (!existing) throw new NotFoundException('Conversation not found');
    await this.repo.markReadByAdmin(conversationId);
  }

  async closeConversation(conversationId: string): Promise<Conversation> {
    const result = await this.repo.setStatus(conversationId, 'closed');
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  async reopenConversation(conversationId: string): Promise<Conversation> {
    const result = await this.repo.setStatus(conversationId, 'open');
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  // ─── Student ────────────────────────────────────────────────────────────────

  findMyConversation(studentId: string): Promise<Conversation | null> {
    return this.repo.findLatestByStudent(studentId);
  }

  async sendAsStudent(studentId: string, body: string): Promise<ConversationMessage> {
    const open = await this.repo.findOpenByStudent(studentId);
    let conversationId: string;
    if (open) {
      conversationId = open.id;
      await this.repo.appendMessage(conversationId, 'student', studentId, body);
    } else {
      const created = await this.repo.createConversation(
        studentId,
        undefined,
        'student',
        studentId,
        body,
      );
      conversationId = created.conversationId;
    }
    const messages = await this.repo.findMessages(conversationId);
    return messages[messages.length - 1];
  }

  markReadByStudent(studentId: string): Promise<void> {
    return this.repo.markReadByStudent(studentId);
  }

  countUnreadForStudent(studentId: string): Promise<number> {
    return this.repo.countUnreadForStudent(studentId);
  }
}
