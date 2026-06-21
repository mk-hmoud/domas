export type ConversationStatus = "open" | "closed";
export type MessageSenderType = "student" | "user";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string;
  senderName?: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  subject?: string;
  status: ConversationStatus;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadByAdmin: boolean;
  unreadByStudent: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
  /** False for a closed conversation when the student has since moved on to a different open one. */
  canReopen: boolean;
}
