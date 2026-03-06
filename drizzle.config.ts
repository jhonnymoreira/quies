import { defineConfig } from 'drizzle-kit';
import { getEnvironmentVariables } from '@/app/get-environment-variables.ts';

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE,
} = getEnvironmentVariables();
export default defineConfig({
  casing: 'snake_case',
  dbCredentials: {
    host: DATABASE_HOST,
    port: DATABASE_PORT,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE,
    ssl: false,
  },
  dialect: 'postgresql',
  out: './drizzle/migrations',
  schema: './src/database/schema.ts',
});
