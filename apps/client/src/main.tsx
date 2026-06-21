import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@mantine/tiptap/styles.css';
import App from './App.tsx';
import { DomMantineProvider } from '@domas/ui';
import { AuthProvider } from '@domas/client-core';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomMantineProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </DomMantineProvider>
  </StrictMode>,
);
