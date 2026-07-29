import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // Binds to 0.0.0.0 (all network interfaces)
    port: 5173,
    watch: {
      usePolling: true, // Required for HMR hot-reloading on Windows Docker mounts
    },
  },
});
