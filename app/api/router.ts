import { router } from './middleware';
import { dashboardRouter } from './routers/dashboard';
import { sourcesRouter } from './routers/sources';
import { qaRouter } from './routers/qa';
import { strategyRouter } from './routers/strategy';
import { actionsRouter } from './routers/actions';
import { diagnosticsRouter } from './routers/diagnostics';
import { adminRouter } from './routers/admin';
import { profitOpsRouter } from './routers/profit_ops';

export const appRouter = router({
  dashboard: dashboardRouter,
  sources: sourcesRouter,
  qa: qaRouter,
  strategy: strategyRouter,
  actions: actionsRouter,
  diagnostics: diagnosticsRouter,
  admin: adminRouter,
  profitOps: profitOpsRouter,
});

export type AppRouter = typeof appRouter;
