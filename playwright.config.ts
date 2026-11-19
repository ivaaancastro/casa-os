import { defineConfig, devices } from '@playwright/test';

/** Tests E2E de la navegación móvil. Requiere `npm run dev` o un build previo. */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Los tests comparten la BD local y el estado de 2FA del usuario de prueba.
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      // Chromium para no depender de WebKit en CI; viewport móvil equivalente.
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
