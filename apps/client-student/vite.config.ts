import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // In production the app is served under /student/ via the nginx reverse proxy.
  // VITE_BASE_URL is injected as a Docker build arg; falls back to "/" for local dev.
  base: process.env.VITE_BASE_URL ?? '/',
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@domas/ui': join(__dirname, '../../packages/ui/src'),
      '@domas/ts-types': join(__dirname, '../../packages/ts-types/src'),
      '@domas/api-client': join(__dirname, '../../packages/api-client/src'),
    },
  },
});
