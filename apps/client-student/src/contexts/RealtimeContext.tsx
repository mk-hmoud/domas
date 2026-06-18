import { createContext, useCallback, useContext, useEffect, useRef, ReactNode } from 'react';
import { portalRealtime, RealtimeEnvelope } from '@domas/api-client';
import { useStudentAuth } from './StudentAuthContext';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

type Handler = (data: unknown) => void;

interface RealtimeContextType {
  subscribe: (channel: string, handler: Handler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

/**
 * Owns the single SSE connection for the student portal. Notifications,
 * messages, and any future channel all multiplex over one EventSource —
 * consumers subscribe by channel instead of opening their own connection.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { student } = useStudentAuth();
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());

  useEffect(() => {
    if (!student) return;

    const es = portalRealtime.stream(API_BASE, (envelope: RealtimeEnvelope) => {
      const handlers = handlersRef.current.get(envelope.channel);
      handlers?.forEach((handler) => handler(envelope.data));
    });

    return () => {
      es.close();
    };
  }, [student]);

  const subscribe = useCallback((channel: string, handler: Handler) => {
    if (!handlersRef.current.has(channel)) {
      handlersRef.current.set(channel, new Set());
    }
    handlersRef.current.get(channel)!.add(handler);
    return () => {
      handlersRef.current.get(channel)?.delete(handler);
    };
  }, []);

  return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
