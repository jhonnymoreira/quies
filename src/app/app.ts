import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { pinoHttp } from 'pino-http';
import { appointments } from '@/appointments/appointments.ts';
import { medspas } from '@/medspas/medspas.ts';
import { services } from '@/services/services.ts';
import { factory } from './factory.ts';
import { logger } from './logger.ts';
import { ErrorResponse } from './responses/error-response.ts';

const app = factory.createApp();

app.use(cors());
app.use(requestId());
app.use(async (context, next) => {
  context.env.incoming.id = context.var.requestId;

  await new Promise<void>((resolve) => {
    pinoHttp({ logger })(context.env.incoming, context.env.outgoing, () => {
      resolve();
    });
  });

  context.set('logger', context.env.incoming.log);

  await next();
});

app.route('/medspas', medspas);
app.route('/services', services);
app.route('/appointments', appointments);

app.notFound((context) => {
  return context.json(new ErrorResponse('Not found'), 404);
});

app.onError((error, context) => {
  context.var.logger.error(error);
  return context.json(new ErrorResponse('Internal Server Error'), 500);
});

export { app };
