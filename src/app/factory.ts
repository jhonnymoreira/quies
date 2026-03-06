import { createFactory } from 'hono/factory';
import type { AppEnv } from '@/app/app-env.ts';

export const factory = createFactory<AppEnv>();
