import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/database/schema.ts';

export const database = drizzle.mock({
  schema,
  casing: 'snake_case',
});
