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
    name: 'Updated At Spa',
    address: '321 Updated Ave',
    phoneNumber: '+12125555555',
    email: 'updated@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Updated At Service',
    description: 'A service for updated_at tests',
  });
  serviceId = service.id;
}, 60_000);

afterAll(() => ctx.teardown());

describe('set_updated_at migration', () => {
  test('updates `updated_at` on medspas when a column changes', async () => {
    const [before] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM medspas WHERE id = ${medspaId}`
    );

    if (!before) {
      throw new Error('Expected row to exist');
    }

    await new Promise((resolve) => setTimeout(resolve, 10));

    await ctx.database.execute(
      sql`UPDATE medspas SET name = 'Renamed Spa' WHERE id = ${medspaId}`
    );

    const [after] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM medspas WHERE id = ${medspaId}`
    );

    if (!after) {
      throw new Error('Expected row to exist');
    }

    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
      new Date(before.updated_at).getTime()
    );
  });

  test('updates `updated_at` on services when a column changes', async () => {
    const [before] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM services WHERE id = ${serviceId}`
    );

    if (!before) {
      throw new Error('Expected row to exist');
    }

    await new Promise((resolve) => setTimeout(resolve, 10));

    await ctx.database.execute(
      sql`UPDATE services SET name = 'Renamed Service' WHERE id = ${serviceId}`
    );

    const [after] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM services WHERE id = ${serviceId}`
    );

    if (!after) {
      throw new Error('Expected row to exist');
    }

    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
      new Date(before.updated_at).getTime()
    );
  });

  test('updates `updated_at` on appointments when a column changes', async () => {
    const appointment = await createAppointment(ctx.database, medspaId, [
      serviceId,
    ]);

    const [before] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM appointments WHERE id = ${appointment.id}`
    );

    if (!before) {
      throw new Error('Expected row to exist');
    }

    await new Promise((resolve) => setTimeout(resolve, 10));

    await ctx.database.execute(
      sql`UPDATE appointments SET status = 'completed', completed_at = NOW() WHERE id = ${appointment.id}`
    );

    const [after] = await ctx.database.execute<{ updated_at: string }>(
      sql`SELECT updated_at FROM appointments WHERE id = ${appointment.id}`
    );

    if (!after) {
      throw new Error('Expected row to exist');
    }

    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
      new Date(before.updated_at).getTime()
    );
  });
});
