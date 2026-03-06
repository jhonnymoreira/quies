import { sql } from 'drizzle-orm';
import { MedspaRepository } from '@/medspas/medspas.repository.ts';
import type { MedspaInsertSchema } from '@/medspas/medspas.schema.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let medspaRepository: MedspaRepository;

const medspa: MedspaInsertSchema = {
  name: 'Glow Spa',
  address: '123 Main St, New York, NY 10001',
  phoneNumber: '+12125551234',
  email: 'hello@glowspa.com',
};

beforeAll(async () => {
  ctx = await createTestDatabase();
  medspaRepository = new MedspaRepository(ctx.database);
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table medspas cascade`);
});

afterAll(() => ctx.teardown());

describe('MedspaRepository', () => {
  describe('insert', () => {
    test('creates a medspa and returns it with all expected fields', async () => {
      const result = await medspaRepository.insert(medspa);

      expect.assert(result.status === 'created');
      expect(result.data.id).toBeTypeOf('string');
      expect(result.data.name).toStrictEqual(medspa.name);
      expect(result.data.address).toStrictEqual(medspa.address);
      expect(result.data.phoneNumber).toStrictEqual(medspa.phoneNumber);
      expect(result.data.email).toStrictEqual(medspa.email);
      expect(result.data.createdAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
      expect(result.data.deletedAt).toBeNull();
    });

    test('returns `duplicate` with constraint `address` when inserting a duplicate address', async () => {
      await medspaRepository.insert(medspa);

      const result = await medspaRepository.insert({
        ...medspa,
        name: 'Another Spa',
        email: 'other@example.com',
        phoneNumber: '+19995551234',
      });

      expect(result).toStrictEqual({
        status: 'duplicate',
        constraint: 'address',
      });
    });
  });
});
