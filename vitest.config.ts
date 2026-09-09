import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Several scripts/__tests__ files run real `npm run build`/`build:app`
    // subprocesses against this repo's actual generated CMS files
    // (src/data/service_categories.json, critical_hotlines.json,
    // src/version.json) — backing them up and restoring them around each
    // test. Running test files in parallel workers lets two such tests
    // race on the same files. Correctness here matters more than the
    // modest speed cost of running test files one at a time.
    fileParallelism: false,
    exclude: [
      '**/e2e/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.worktrees/**',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
