import {
  createViteFileRoutesRouter,
  type FileRouteModule,
} from 'next-fs-routes';

export const router = createViteFileRoutesRouter({
  routeModules: import.meta.glob<FileRouteModule>(
    './routes/**/{layout,page}.tsx'
  ),
  validateInDev: import.meta.env.DEV,
});
