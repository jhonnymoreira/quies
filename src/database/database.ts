import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnvironmentVariables } from '@/app/get-environment-variables.ts';
import * as schema from './schema.ts';

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE,
} = getEnvironmentVariables();
export const client = postgres({
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE,
});
export const database = drizzle({
  client,
  schema,
  casing: 'snake_case',
});
export type Database = typeof database;
