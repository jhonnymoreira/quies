import { sql } from 'drizzle-orm';
import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import type { Appointment } from '@/appointments/appointments.schema.ts';
import { createMedspa } from '../fixtures/create-medspa.ts';
import { createService } from '../fixtures/create-service.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let appointmentRepository: AppointmentRepository;
let medspaId: string;
let serviceId: string;

async function createTerminalAppointment(
  status: 'completed' | 'canceled'
): Promise<Appointment> {
  const insertResult = await appointmentRepository.insert({
    medspaId,
    startTime: new Date(Date.now() + 86_400_000),
    serviceIds: [serviceId],
  });
  if (insertResult.status !== 'created') {
    throw new Error('Expected appointment to be created');
  }

  const updateResult = await appointmentRepository.update(
    insertResult.data.id,
    {
      status,
    }
  );
  if (updateResult.status !== 'updated') {
    throw new Error(`Expected appointment to be marked as ${status}`);
  }

  return updateResult.data;
}

beforeAll(async () => {
  ctx = await createTestDatabase();
  appointmentRepository = new AppointmentRepository(ctx.database);

  const medspa = await createMedspa(ctx.database, {
    name: 'Trigger Test Spa',
    address: '789 Trigger Ave',
    phoneNumber: '+12125559999',
    email: 'trigger@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Basic Service',
    description: 'A basic service',
  });
  serviceId = service.id;
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table appointments cascade`);
});

afterAll(() => ctx.teardown());

describe('freeze_terminal_appointments trigger', () => {
  test('prevents raw UPDATE on a completed appointment', async () => {
    const appointment = await createTerminalAppointment('completed');

    await expect(
      ctx.database.execute(
        sql`update appointments set start_time = now() where id = ${appointment.id}`
      )
    ).rejects.toThrow();
  });

  test('prevents raw UPDATE on a canceled appointment', async () => {
    const appointment = await createTerminalAppointment('canceled');

    await expect(
      ctx.database.execute(
        sql`update appointments set start_time = now() where id = ${appointment.id}`
      )
    ).rejects.toThrow();
  });

  test('allows updating only `deleted_at` on a completed appointment', async () => {
    const appointment = await createTerminalAppointment('completed');

    await ctx.database.execute(
      sql`update appointments set deleted_at = now() where id = ${appointment.id}`
    );

    const [row] = await ctx.database.execute<{
      deleted_at: string;
      start_time: string;
      created_at: string;
      updated_at: string;
    }>(
      sql`select deleted_at, start_time, created_at, updated_at from appointments where id = ${appointment.id}`
    );

    if (!row) {
      throw new Error('Expected row to exist');
    }

    expect(row.deleted_at).not.toBeNull();
    expect(new Date(row.start_time)).toStrictEqual(appointment.startTime);
    expect(new Date(row.created_at)).toStrictEqual(appointment.createdAt);
    expect(new Date(row.updated_at).getTime()).toBeGreaterThanOrEqual(
      appointment.updatedAt.getTime()
    );
  });
});
