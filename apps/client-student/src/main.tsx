import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DomMantineProvider } from '@domas/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomMantineProvider>
      <App />
    </DomMantineProvider>
  </StrictMode>,
);
