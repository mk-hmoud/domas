import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { portalMessages } from '@domas/api-client';
import { Conversation, ConversationMessage } from '@domas/ts-types';
import { useStudentAuth } from './StudentAuthContext';
import { useRealtime } from './RealtimeContext';

interface MessagesContextType {
  conversation: Conversation | null;
  unreadCount: number;
  loading: boolean;
  sendMessage: (body: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { student } = useStudentAuth();
  const { subscribe } = useRealtime();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const [conv, count] = await Promise.all([
        portalMessages.getMine(),
        portalMessages.getUnreadCount(),
      ]);
      setConversation(conv);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (!student) {
      setConversation(null);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [student, refresh]);

  // Subscribe to the shared realtime connection for live message delivery
  useEffect(() => {
    if (!student) return;
    return subscribe('message', (data) => {
      const message = data as ConversationMessage;
      setConversation((prev) => {
        if (!prev || prev.id !== message.conversationId) {
          // Belongs to a conversation we haven't loaded yet (e.g. admin just started one)
          refresh();
          return prev;
        }
        return { ...prev, messages: [...(prev.messages ?? []), message] };
      });
      setUnreadCount((c) => c + 1);
    });
  }, [student, subscribe, refresh]);

  const sendMessage = useCallback(
    async (body: string) => {
      await portalMessages.send({ body });
      await refresh();
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    await portalMessages.markRead();
    setUnreadCount(0);
    setConversation((prev) => (prev ? { ...prev, unreadByStudent: false } : prev));
  }, []);

  return (
    <MessagesContext.Provider
      value={{ conversation, unreadCount, loading, sendMessage, markAllAsRead, refresh }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
