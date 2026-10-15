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
    // Dynamic APIs use the Worker on 127.0.0.1:5525 during development.
    // Static files such as /api/projects.json stay served by Vite.
    proxy: {
      '^/api/(assistant(?:/stream)?|weather|forex|search(?:/.*)?)(?:\\?|$)': {
        target: 'http://127.0.0.1:5525',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyRequest, request) => {
            const origin = request.headers.origin;
            if (!origin) return;
            try {
              // Keep the production allowlist strict while supporting the
              // existing same-origin Vite preview. Foreign origins pass
              // through unchanged and are rejected by the Worker.
              const url = new URL(origin);
              if (
                (url.protocol === 'http:' || url.protocol === 'https:') &&
                url.origin === origin &&
                url.host === request.headers.host
              ) {
                proxyRequest.setHeader('Origin', 'https://www.gov.ph');
              }
            } catch {
              // Malformed origins are rejected by the Worker.
            }
          });
        },
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
