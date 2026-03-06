import type { HttpBindings } from '@hono/node-server';
import type pino from 'pino';

export interface AppEnv {
  Bindings: HttpBindings;
  Variables: {
    logger: pino.Logger;
    requestId: string;
  };
}
