import { defineConfig } from 'vite';

// The migration's command as one file for Rumbo 2's image (deploy/Dockerfile.v2): the domain and the contracts go
// inside; pg, zod and the frozen v1 (pruebas/v1, read from disk next to it) stay outside.
export default defineConfig({
  root: import.meta.dirname,
  build: {
    ssr: 'src/cli.ts',
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node24',
    rollupOptions: { external: [/pruebas\/v1\/motor\.mjs$/, 'pg', 'zod'], output: { entryFileNames: 'cli.js' } },
  },
  ssr: { noExternal: ['@rumbo/dominio', '@rumbo/contratos'] },
});
