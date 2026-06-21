import { apiClient } from "../client";
import {
  Conversation,
  ConversationMessage,
  CreateConversationDto,
  SendMessageDto,
} from "@domas/ts-types";

export const conversations = {
  findAll: async (params?: {
    status?: "open" | "closed";
    search?: string;
  }): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>("/conversations", {
      params,
    });
    return response.data;
  },

  findOne: async (id: string): Promise<Conversation> => {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  start: async (data: CreateConversationDto): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>("/conversations", data);
    return response.data;
  },

  reply: async (
    id: string,
    data: SendMessageDto,
  ): Promise<ConversationMessage> => {
    const response = await apiClient.post<ConversationMessage>(
      `/conversations/${id}/messages`,
      data,
    );
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/conversations/${id}/read`);
  },

  close: async (id: string): Promise<Conversation> => {
    const response = await apiClient.patch<Conversation>(
      `/conversations/${id}/close`,
    );
    return response.data;
  },

  reopen: async (id: string): Promise<Conversation> => {
    const response = await apiClient.patch<Conversation>(
      `/conversations/${id}/reopen`,
    );
    return response.data;
  },
};
