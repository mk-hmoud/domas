export interface SendMessageDto {
  body: string;
}

export interface CreateConversationDto {
  studentId: string;
  subject?: string;
  body: string;
}
