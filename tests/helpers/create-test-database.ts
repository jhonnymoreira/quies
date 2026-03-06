import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@/database/schema.ts';

export type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;

export interface TestDatabaseContext {
  database: TestDatabase;
  teardown: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabaseContext> {
  const container = await new PostgreSqlContainer('postgres:17').start();
  const client = postgres(container.getConnectionUri(), {
    onnotice: () => {},
  });
  const database = drizzle({ client, schema, casing: 'snake_case' });

  await migrate(database, { migrationsFolder: './drizzle/migrations' });

  return {
    database,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
