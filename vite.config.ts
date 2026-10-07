import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5125,
    strictPort: true,
    // The Civic Assistant talks to the Worker (functions/api/assistant.ts),
    // which `npm run functions:dev` serves on 127.0.0.1:5525. Only this path
    // is forwarded so static files under public/api stay served by Vite.
    proxy: {
      '/api/assistant': {
        target: 'http://127.0.0.1:5525',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
