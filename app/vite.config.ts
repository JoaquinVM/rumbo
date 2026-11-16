import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The server serves dist/index.html at / and dist/assets/* next to it.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
});
