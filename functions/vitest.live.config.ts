import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.live.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Server startup can take several seconds
    hookTimeout: 30000,
    testTimeout: 15000,
  },
});
