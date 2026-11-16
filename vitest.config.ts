import { defineConfig } from 'vitest/config';

// One run for every workspace (without PostgreSQL): domain, contracts, app, server, migration, the layer rules and the v1 oracle.
export default defineConfig({
  test: {
    include: [
      'paquetes/*/src/**/*.test.ts',
      'app/src/**/*.test.{ts,tsx}',
      'servidor/src/**/*.test.ts',
      'migracion/src/**/*.test.ts',
      'pruebas/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/*.pg.test.ts'], // against PostgreSQL: servidor/vitest.config.ts
    environment: 'node',
  },
});
