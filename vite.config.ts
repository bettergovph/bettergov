import { defineConfig, loadEnv, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { handleGisLocality } from './functions/api/gis-ph';

/** Dev-only stand-in for functions/index.ts. Production still needs the Worker. */
function gisLocalityDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'gis-locality-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost');
        const pathname = requestUrl.pathname;
        if (pathname !== '/api/gis/locality') {
          next();
          return;
        }
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        const gisEnv = {
          GIS_PH_API_KEY: process.env.GIS_PH_API_KEY || env.GIS_PH_API_KEY,
          GIS_PSGC_CODE: process.env.GIS_PSGC_CODE || env.GIS_PSGC_CODE,
          GIS_PH_BASE_URL: process.env.GIS_PH_BASE_URL || env.GIS_PH_BASE_URL,
        };
        const response = await handleGisLocality(gisEnv);
        res.statusCode = response.status;
        const contentType = response.headers.get('Content-Type');
        if (contentType) res.setHeader('Content-Type', contentType);
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    envPrefix: ['VITE_', 'GIS_PSGC_CODE'],
    build: {
      outDir: 'dist',
    },
    plugins: [react(), tailwindcss(), gisLocalityDevApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
