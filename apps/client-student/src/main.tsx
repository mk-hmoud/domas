import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DomMantineProvider } from '@domas/ui';
import { StudentAuthProvider } from './contexts/StudentAuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomMantineProvider>
      <StudentAuthProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </StudentAuthProvider>
    </DomMantineProvider>
  </StrictMode>,
);
