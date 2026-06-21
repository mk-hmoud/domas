import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { portalNotifications } from '@domas/api-client';
import { useStudentAuth } from './StudentAuthContext';
import { useRealtime } from './RealtimeContext';

interface NotificationsContextType {
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { student } = useStudentAuth();
  const { subscribe } = useRealtime();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count when authenticated
  useEffect(() => {
    if (!student) {
      setUnreadCount(0);
      return;
    }

    portalNotifications
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [student]);

  // Subscribe to the shared realtime connection for live notifications
  useEffect(() => {
    if (!student) return;
    return subscribe('notification', () => {
      setUnreadCount((c) => c + 1);
    });
  }, [student, subscribe]);

  const markAsRead = useCallback(async (id: string) => {
    await portalNotifications.markAsRead(id);
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await portalNotifications.markAllAsRead();
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
