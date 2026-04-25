import { router } from './middleware';
import { dashboardRouter } from './routers/dashboard';
import { sourcesRouter } from './routers/sources';
import { qaRouter } from './routers/qa';

export const appRouter = router({
  dashboard: dashboardRouter,
  sources: sourcesRouter,
  qa: qaRouter,
});

export type AppRouter = typeof appRouter;
