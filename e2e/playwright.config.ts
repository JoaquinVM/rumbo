import { defineConfig, devices } from '@playwright/test';

// PUB-06: Chromium and WebKit (Joaquín uses an iPhone), 375 px wide, light and dark, against Rumbo 2's server with
// PostgreSQL and the fake Access of servidor-prueba.mjs. Video and trace are kept only for what fails.
const telefono = { viewport: { width: 375, height: 812 }, hasTouch: true };
const navegadores = [
  { nombre: 'chromium', dispositivo: devices['Desktop Chrome'] },
  { nombre: 'webkit', dispositivo: devices['Desktop Safari'] },
] as const;
const temas = ['light', 'dark'] as const;

export default defineConfig({
  testDir: 'pruebas',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: navegadores.flatMap(({ nombre, dispositivo }) =>
    temas.map((tema) => ({
      name: `${nombre}-${tema === 'light' ? 'claro' : 'oscuro'}`,
      use: { ...dispositivo, ...telefono, colorScheme: tema },
    })),
  ),
  webServer: {
    command: 'node --conditions=rumbo-compilado servidor-prueba.mjs',
    url: 'http://localhost:4173/salud',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
