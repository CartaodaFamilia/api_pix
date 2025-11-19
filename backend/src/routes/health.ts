// backend/src/routes/health.ts
import { router, publicProcedure } from '../lib/trpc';

export const healthRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }),
});