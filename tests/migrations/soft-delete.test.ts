import { sql } from 'drizzle-orm';
import { createAppointment } from '../fixtures/create-appointment.ts';
import { createMedspa } from '../fixtures/create-medspa.ts';
import { createService } from '../fixtures/create-service.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let medspaId: string;
let serviceId: string;

beforeAll(async () => {
  ctx = await createTestDatabase();

  const medspa = await createMedspa(ctx.database, {
    name: 'Soft Delete Spa',
    address: '456 Soft Delete Ave',
    phoneNumber: '+12125558888',
    email: 'softdelete@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Soft Delete Service',
    description: 'A service for soft delete tests',
  });
  serviceId = service.id;
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table medspas cascade`);

  const medspa = await createMedspa(ctx.database, {
    name: 'Soft Delete Spa',
    address: '456 Soft Delete Ave',
    phoneNumber: '+12125558888',
    email: 'softdelete@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Soft Delete Service',
    description: 'A service for soft delete tests',
  });
  serviceId = service.id;
});

afterAll(() => ctx.teardown());

describe('soft_delete trigger', () => {
  test('DELETE on medspas sets `deleted_at` instead of removing the row', async () => {
    await ctx.database.execute(
      sql`delete from services where medspa_id = ${medspaId}`
    );
    await ctx.database.execute(sql`delete from medspas where id = ${medspaId}`);

    const [row] = await ctx.database.execute<{
      id: string;
      deleted_at: string | null;
    }>(sql`select id, deleted_at from medspas where id = ${medspaId}`);

    if (!row) {
      throw new Error('Expected row to still exist');
    }

    expect(row.id).toStrictEqual(medspaId);
    expect(row.deleted_at).not.toBeNull();
  });

  test('DELETE on services sets `deleted_at` instead of removing the row', async () => {
    await ctx.database.execute(
      sql`delete from services where id = ${serviceId}`
    );

    const [row] = await ctx.database.execute<{
      id: string;
      deleted_at: string | null;
    }>(sql`select id, deleted_at from services where id = ${serviceId}`);

    if (!row) {
      throw new Error('Expected row to still exist');
    }

    expect(row.id).toStrictEqual(serviceId);
    expect(row.deleted_at).not.toBeNull();
  });

  test('DELETE on appointments sets `deleted_at` instead of removing the row', async () => {
    const appointment = await createAppointment(ctx.database, medspaId, [
      serviceId,
    ]);

    await ctx.database.execute(
      sql`delete from appointments where id = ${appointment.id}`
    );

    const [row] = await ctx.database.execute<{
      id: string;
      deleted_at: string | null;
    }>(
      sql`select id, deleted_at from appointments where id = ${appointment.id}`
    );

    if (!row) {
      throw new Error('Expected row to still exist');
    }

    expect(row.id).toStrictEqual(appointment.id);
    expect(row.deleted_at).not.toBeNull();
  });
});
