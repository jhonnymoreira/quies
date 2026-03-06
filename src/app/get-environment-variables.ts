import { z } from 'zod';

const envSchema = z.object({
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export function getEnvironmentVariables() {
  return envSchema.parse(process.env);
}
