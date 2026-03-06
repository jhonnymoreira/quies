import pino from 'pino';
import { getEnvironmentVariables } from '@/app/get-environment-variables.ts';

const { NODE_ENV } = getEnvironmentVariables();

export const logger =
  NODE_ENV === 'development'
    ? pino({ transport: { target: 'pino-pretty' } })
    : pino();
