import { router } from './middleware';
import { dashboardRouter } from './routers/dashboard';
import { sourcesRouter } from './routers/sources';
import { qaRouter } from './routers/qa';
import { strategyRouter } from './routers/strategy';

export const appRouter = router({
  dashboard: dashboardRouter,
  sources: sourcesRouter,
  qa: qaRouter,
  strategy: strategyRouter,
});

export type AppRouter = typeof appRouter;
