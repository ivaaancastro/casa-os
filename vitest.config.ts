import { defineConfig } from 'vitest/config';

/** Los tests E2E viven en tests/e2e y los ejecuta Playwright, no Vitest. */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
