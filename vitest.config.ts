import { defineConfig } from 'vitest/config';

// One run for every workspace: domain, contracts, app, server, migration, the layer rules and the v1 oracle.
export default defineConfig({
  test: {
    include: [
      'paquetes/*/src/**/*.test.ts',
      'app/src/**/*.test.{ts,tsx}',
      'servidor/src/**/*.test.ts',
      'migracion/src/**/*.test.ts',
      'pruebas/**/*.test.ts',
    ],
    environment: 'node',
  },
});
