import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // custom chunking
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (
            id.includes('meilisearch') ||
            id.includes('instantsearch') ||
            id.includes('algoliasearch')
          ) {
            return 'search';
          }
          if (id.includes('i18next')) return 'i18n';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
