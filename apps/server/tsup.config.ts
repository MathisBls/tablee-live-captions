import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Le paquet partagé est publié en source TypeScript : on l'embarque dans le bundle.
  noExternal: ['@tablee/shared'],
});
