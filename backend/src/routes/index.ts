// backend/src/routes/index.ts
import { router } from '../lib/trpc';
import { clientsRouter } from './clients';
import { recurrencesRouter } from './recurrences';
import { reportsRouter } from './reports';
import { healthRouter } from './health';

export const appRouter = router({
  health: healthRouter,
  clients: clientsRouter,
  recurrences: recurrencesRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;