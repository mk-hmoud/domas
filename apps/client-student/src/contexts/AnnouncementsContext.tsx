import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { portalAnnouncements } from '@domas/api-client';
import { Announcement } from '@domas/ts-types';
import { useStudentAuth } from './StudentAuthContext';

interface AnnouncementsContextType {
  unreadCount: number;
  items: Announcement[];
  loading: boolean;
  markAllAsSeen: () => void;
  refresh: () => Promise<void>;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

const SEEN_ANNOUNCEMENTS_KEY = 'domas_seen_announcements';

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const { student } = useStudentAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const calculateUnreadCount = useCallback((announcements: Announcement[]) => {
    const seenIdsString = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    const seenIds: string[] = seenIdsString ? JSON.parse(seenIdsString) : [];

    // An announcement is unread if its ID is not in the seen list
    const unread = announcements.filter((a) => !seenIds.includes(a.id)).length;
    setUnreadCount(unread);
  }, []);

  const refresh = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      const data = await portalAnnouncements.getAll();
      setItems(data);
      calculateUnreadCount(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [student, calculateUnreadCount]);

  useEffect(() => {
    refresh();
    // Poll for new announcements every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markAllAsSeen = useCallback(() => {
    const allIds = items.map((a) => a.id);
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(allIds));
    setUnreadCount(0);
  }, [items]);

  return (
    <AnnouncementsContext.Provider value={{ unreadCount, items, loading, markAllAsSeen, refresh }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error('useAnnouncements must be used within AnnouncementsProvider');
  return ctx;
}
