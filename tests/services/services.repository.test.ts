import { sql } from 'drizzle-orm';
import type { Medspa } from '@/medspas/medspas.schema.ts';
import { ServiceRepository } from '@/services/services.repository.ts';
import type { ServiceInsertSchema } from '@/services/services.schema.ts';
import { createMedspa } from '../fixtures/create-medspa.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let serviceRepository: ServiceRepository;
let medspa: Medspa;

beforeAll(async () => {
  ctx = await createTestDatabase();
  serviceRepository = new ServiceRepository(ctx.database);
  medspa = await createMedspa(ctx.database);
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table services cascade`);
});

afterAll(() => ctx.teardown());

function serviceFixture(
  overrides?: Partial<ServiceInsertSchema>
): ServiceInsertSchema {
  return {
    name: 'Botox',
    description: 'Botox injection treatment',
    price: 30000,
    duration: 30,
    medspaId: medspa.id,
    ...overrides,
  };
}

describe('ServiceRepository', () => {
  describe('insert', () => {
    test('creates a service and returns it with all expected fields', async () => {
      const fixture = serviceFixture();
      const result = await serviceRepository.insert(fixture);

      expect.assert(result.status === 'created');
      expect(result.data.id).toBeTypeOf('string');
      expect(result.data.name).toStrictEqual(fixture.name);
      expect(result.data.description).toStrictEqual(fixture.description);
      expect(result.data.price).toStrictEqual(fixture.price);
      expect(result.data.duration).toStrictEqual(fixture.duration);
      expect(result.data.medspaId).toStrictEqual(medspa.id);
      expect(result.data.createdAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
      expect(result.data.deletedAt).toBeNull();
    });

    test('returns `duplicate` with constraint `medspa_id_name` on duplicate (medspaId, name)', async () => {
      await serviceRepository.insert(serviceFixture());

      const result = await serviceRepository.insert(
        serviceFixture({
          description: 'Different description',
          price: 40000,
          duration: 45,
        })
      );

      expect(result).toStrictEqual({
        status: 'duplicate',
        constraint: 'medspa_id_name',
      });
    });

    test('returns `reference_not_found` with field `medspaId` for non-existent medspaId', async () => {
      const result = await serviceRepository.insert(
        serviceFixture({
          medspaId: '00000000-0000-0000-0000-000000000000',
        })
      );

      expect(result).toStrictEqual({
        status: 'reference_not_found',
        field: 'medspaId',
      });
    });
  });

  describe('update', () => {
    test('updates a service and returns it with the new name', async () => {
      const insertResult = await serviceRepository.insert(serviceFixture());
      expect.assert(insertResult.status === 'created');

      const result = await serviceRepository.update(insertResult.data.id, {
        name: 'Updated Botox',
      });

      expect.assert(result.status === 'updated');
      expect(result.data.name).toStrictEqual('Updated Botox');
      expect(result.data.id).toStrictEqual(insertResult.data.id);
    });

    test('returns `not_found` for non-existent serviceId', async () => {
      const result = await serviceRepository.update(
        '00000000-0000-0000-0000-000000000000',
        { name: 'Ghost' }
      );

      expect(result).toStrictEqual({ status: 'not_found' });
    });

    test('returns `not_found` for soft-deleted service', async () => {
      const insertResult = await serviceRepository.insert(serviceFixture());
      expect.assert(insertResult.status === 'created');

      await ctx.database.execute(
        sql`update services set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await serviceRepository.update(insertResult.data.id, {
        name: 'Ghost',
      });

      expect(result).toStrictEqual({ status: 'not_found' });
    });

    test('returns `duplicate` with constraint `medspa_id_name` on duplicate name within same medspa', async () => {
      await serviceRepository.insert(serviceFixture({ name: 'Botox' }));
      const secondResult = await serviceRepository.insert(
        serviceFixture({ name: 'Filler' })
      );
      expect.assert(secondResult.status === 'created');

      const result = await serviceRepository.update(secondResult.data.id, {
        name: 'Botox',
      });

      expect(result).toStrictEqual({
        status: 'duplicate',
        constraint: 'medspa_id_name',
      });
    });
  });

  describe('findById', () => {
    test('returns `found` with the service', async () => {
      const insertResult = await serviceRepository.insert(serviceFixture());
      expect.assert(insertResult.status === 'created');

      const result = await serviceRepository.findById(insertResult.data.id);

      expect.assert(result.status === 'found');
      expect(result.data).toStrictEqual(insertResult.data);
    });

    test('returns `not_found` for non-existent id', async () => {
      const result = await serviceRepository.findById(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result).toStrictEqual({ status: 'not_found' });
    });

    test('returns `not_found` for soft-deleted service', async () => {
      const insertResult = await serviceRepository.insert(serviceFixture());
      expect.assert(insertResult.status === 'created');

      await ctx.database.execute(
        sql`update services set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await serviceRepository.findById(insertResult.data.id);

      expect(result).toStrictEqual({ status: 'not_found' });
    });
  });

  describe('findAllByMedspaId', () => {
    test('returns `found` with all active services ordered by `createdAt` descending', async () => {
      const firstResult = await serviceRepository.insert(
        serviceFixture({ name: 'Botox' })
      );
      const secondResult = await serviceRepository.insert(
        serviceFixture({ name: 'Filler' })
      );
      expect.assert(firstResult.status === 'created');
      expect.assert(secondResult.status === 'created');

      const result = await serviceRepository.findAllByMedspaId(medspa.id);

      expect.assert(result.status === 'found');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.id).toStrictEqual(secondResult.data.id);
      expect(result.data[1]?.id).toStrictEqual(firstResult.data.id);
    });

    test('returns `found` with empty array for medspa with no services', async () => {
      const result = await serviceRepository.findAllByMedspaId(medspa.id);

      expect.assert(result.status === 'found');
      expect(result.data).toStrictEqual([]);
    });

    test('excludes soft-deleted services', async () => {
      const insertResult = await serviceRepository.insert(
        serviceFixture({ name: 'Botox' })
      );
      await serviceRepository.insert(serviceFixture({ name: 'Filler' }));
      expect.assert(insertResult.status === 'created');

      await ctx.database.execute(
        sql`update services set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await serviceRepository.findAllByMedspaId(medspa.id);

      expect.assert(result.status === 'found');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.name).toStrictEqual('Filler');
    });

    test('returns `reference_not_found` with field `medspaId` for non-existent medspaId', async () => {
      const result = await serviceRepository.findAllByMedspaId(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result).toStrictEqual({
        status: 'reference_not_found',
        field: 'medspaId',
      });
    });
  });
});
