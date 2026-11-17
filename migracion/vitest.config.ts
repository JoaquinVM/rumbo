import { defineConfig } from 'vitest/config';

// The migration against PostgreSQL (PG* variables): `npm run probar-servidor`, in the `servidor` job of the CI.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['src/**/*.pg.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
  },
});
