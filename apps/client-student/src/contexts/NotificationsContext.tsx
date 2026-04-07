import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { portalNotifications } from '@domas/api-client';
import { StudentNotification } from '@domas/ts-types';
import { useStudentAuth } from './StudentAuthContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

interface NotificationsContextType {
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { student } = useStudentAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  // Fetch initial unread count and open SSE stream when authenticated
  useEffect(() => {
    if (!student) {
      setUnreadCount(0);
      return;
    }

    portalNotifications
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});

    const es = portalNotifications.stream(API_BASE, (_notification: StudentNotification) => {
      setUnreadCount((c) => c + 1);
    });
    esRef.current = es;

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [student]);

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
