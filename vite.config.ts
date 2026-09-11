import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    outDir: 'dist',
    // Use hidden source maps in production to avoid exposing source code
    // while still allowing error tracking services to use them
    // In development, use full source maps for easier debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}));
