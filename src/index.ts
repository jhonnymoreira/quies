import { serve } from '@hono/node-server';
import { app } from '@/app/app.ts';
import { logger } from '@/app/logger.ts';

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    logger.info(
      `Server is running on http://localhost:${info.port.toString()}`
    );
  }
);
