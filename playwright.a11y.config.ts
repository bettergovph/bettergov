import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: '**/accessibility.spec.ts',
  testIgnore: [],
  // Keep this audit light enough for the shared development VM.
  workers: 2,
  timeout: 90_000,
  retries: 0,
  expect: { timeout: 3_000 },
  outputDir: 'test-results/a11y',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/a11y', open: 'never' }],
    ['json', { outputFile: 'test-results/accessibility-results.json' }],
  ],
  use: {
    ...base.use,
    locale: 'en-PH',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'a11y-desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'a11y-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
