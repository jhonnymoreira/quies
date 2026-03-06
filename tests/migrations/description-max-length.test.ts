import { sql } from 'drizzle-orm';
import { createMedspa } from '../fixtures/create-medspa.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let medspaId: string;

beforeAll(async () => {
  ctx = await createTestDatabase();

  const medspa = await createMedspa(ctx.database, {
    name: 'Max Length Spa',
    address: '789 Max Length Ave',
    phoneNumber: '+12125556666',
    email: 'maxlength@spa.com',
  });
  medspaId = medspa.id;
}, 60_000);

afterAll(() => ctx.teardown());

describe('description_max_length migration', () => {
  test('rejects `description` exceeding 500 characters', async () => {
    const description = 'a'.repeat(501);

    await expect(
      ctx.database.execute(
        sql`INSERT INTO services (name, description, price, duration, medspa_id) VALUES ('Service 501', ${description}, 100, 30, ${medspaId})`
      )
    ).rejects.toThrow();
  });
});
