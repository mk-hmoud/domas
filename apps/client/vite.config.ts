import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Read version from root package.json
const rootPkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(rootPkg.version),
  },
  server: {
    port: 5174,
    host: true,
  },
});
