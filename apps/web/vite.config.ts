import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const backendUrl = 'http://127.0.0.1:3001';
// HTTPS local : getUserMedia exige un contexte sécurisé dès qu'on sort de localhost (démo tablette en LAN).
const useHttps = process.env['TABLEE_HTTPS'] === '1';

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Le worklet audio est chargé par audioWorklet.addModule, qui attend un module ES.
  worker: { format: 'es' },
  server: {
    proxy: {
      '/api': backendUrl,
      '/health': backendUrl,
      '/ready': backendUrl,
      '/ws': { target: backendUrl, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
