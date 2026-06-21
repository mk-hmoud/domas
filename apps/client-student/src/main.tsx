import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DomMantineProvider } from '@domas/ui';
import { StudentAuthProvider } from './contexts/StudentAuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AnnouncementsProvider } from './contexts/AnnouncementsContext';
import { MessagesProvider } from './contexts/MessagesContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomMantineProvider>
      <StudentAuthProvider>
        <RealtimeProvider>
          <NotificationsProvider>
            <AnnouncementsProvider>
              <MessagesProvider>
                <App />
              </MessagesProvider>
            </AnnouncementsProvider>
          </NotificationsProvider>
        </RealtimeProvider>
      </StudentAuthProvider>
    </DomMantineProvider>
  </StrictMode>,
);
