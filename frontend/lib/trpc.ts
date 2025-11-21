import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routes';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      async fetch(url, options) {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
        return response;
      },
    }),
  ],
});
