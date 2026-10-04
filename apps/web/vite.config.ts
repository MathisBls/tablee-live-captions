import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const backendUrl = 'http://127.0.0.1:3001';
// Démo sur tablette ou téléphone : getUserMedia exige un contexte sécurisé dès qu'on sort de
// localhost. TABLEE_HTTPS=1 sert donc le front en HTTPS sur le réseau local ; le back reste sur
// 127.0.0.1, joint uniquement à travers le proxy ci-dessous.
const useHttps = process.env['TABLEE_HTTPS'] === '1';

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Le worklet audio est chargé par audioWorklet.addModule, qui attend un module ES.
  worker: { format: 'es' },
  server: {
    host: useHttps,
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
