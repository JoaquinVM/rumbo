import { defineConfig } from 'vite';

// The test environment's loader as one file for Node (job 081): it carries the domain and the contracts with it;
// pg comes from the image.
export default defineConfig({
  build: {
    ssr: 'src/cargar-prueba.ts',
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node24',
    rollupOptions: { output: { entryFileNames: 'cargar-prueba.mjs' } },
  },
  ssr: { noExternal: true, external: ['pg'] },
});
