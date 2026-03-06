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
    name: 'Not Empty Spa',
    address: '123 Not Empty Ave',
    phoneNumber: '+12125557777',
    email: 'notempty@spa.com',
  });
  medspaId = medspa.id;
}, 60_000);

afterAll(() => ctx.teardown());

describe('not_empty_constraints migration', () => {
  describe('medspas', () => {
    test('rejects empty `name`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO medspas (name, address, phone_number, email) VALUES ('', '456 Test Ave', '+12125550001', 'a@b.com')`
        )
      ).rejects.toThrow();
    });

    test('rejects whitespace-only `name`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO medspas (name, address, phone_number, email) VALUES ('   ', '456 Test Ave', '+12125550001', 'a@b.com')`
        )
      ).rejects.toThrow();
    });

    test('rejects empty `address`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO medspas (name, address, phone_number, email) VALUES ('Test', '', '+12125550001', 'a@b.com')`
        )
      ).rejects.toThrow();
    });

    test('rejects empty `phone_number`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO medspas (name, address, phone_number, email) VALUES ('Test', '456 Test Ave', '', 'a@b.com')`
        )
      ).rejects.toThrow();
    });

    test('rejects empty `email`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO medspas (name, address, phone_number, email) VALUES ('Test', '456 Test Ave', '+12125550001', '')`
        )
      ).rejects.toThrow();
    });
  });

  describe('services', () => {
    test('rejects empty `name`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO services (name, description, price, duration, medspa_id) VALUES ('', 'A service', 100, 30, ${medspaId})`
        )
      ).rejects.toThrow();
    });

    test('rejects empty `description`', async () => {
      await expect(
        ctx.database.execute(
          sql`INSERT INTO services (name, description, price, duration, medspa_id) VALUES ('Test', '', 100, 30, ${medspaId})`
        )
      ).rejects.toThrow();
    });
  });
});
