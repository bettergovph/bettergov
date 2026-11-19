import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // scripts/__tests__/build-network-boundary.test.ts runs a real
    // `npm run build` that reads the committed src/data files and rewrites
    // public/sitemap.xml, public/llms.txt and src/version.json (restoring
    // them afterwards), while scripts/talacms/__tests__/write.test.ts
    // temporarily overwrites src/data/service_categories.json. Running test
    // files in parallel workers lets them race on the same files.
    // Correctness here matters more than the modest speed cost of running
    // test files one at a time.
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
