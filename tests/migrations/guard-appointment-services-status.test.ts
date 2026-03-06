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
let extraServiceId: string;

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
    { status }
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
    name: 'Guard Trigger Spa',
    address: '200 Guard Ave',
    phoneNumber: '+12125557777',
    email: 'guard@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Guard Service',
    description: 'A service for guard trigger tests',
  });
  serviceId = service.id;

  const extra = await createService(ctx.database, medspaId, {
    name: 'Extra Service',
    description: 'An extra service for guard trigger tests',
  });
  extraServiceId = extra.id;
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table appointments cascade`);
});

afterAll(() => ctx.teardown());

describe('guard_appointment_services_status trigger', () => {
  describe('INSERT on appointments_services', () => {
    test('rejects when appointment is completed', async () => {
      const appointment = await createTerminalAppointment('completed');

      await expect(
        ctx.database.execute(
          sql`insert into appointments_services (appointment_id, service_id, medspa_id, price, duration)
              values (${appointment.id}, ${extraServiceId}, ${medspaId}, 5000, 15)`
        )
      ).rejects.toThrow();
    });

    test('rejects when appointment is canceled', async () => {
      const appointment = await createTerminalAppointment('canceled');

      await expect(
        ctx.database.execute(
          sql`insert into appointments_services (appointment_id, service_id, medspa_id, price, duration)
              values (${appointment.id}, ${extraServiceId}, ${medspaId}, 5000, 15)`
        )
      ).rejects.toThrow();
    });

    test('allows when appointment is scheduled', async () => {
      const result = await appointmentRepository.insert({
        medspaId,
        startTime: new Date(Date.now() + 86_400_000),
        serviceIds: [serviceId],
      });
      expect.assert(result.status === 'created');

      await expect(
        ctx.database.execute(
          sql`insert into appointments_services (appointment_id, service_id, medspa_id, price, duration)
              values (${result.data.id}, ${extraServiceId}, ${medspaId}, 5000, 15)`
        )
      ).resolves.not.toThrow();
    });
  });

  describe('DELETE on appointments_services', () => {
    test('rejects when appointment is completed', async () => {
      const appointment = await createTerminalAppointment('completed');

      await expect(
        ctx.database.execute(
          sql`delete from appointments_services where appointment_id = ${appointment.id}`
        )
      ).rejects.toThrow();
    });

    test('rejects when appointment is canceled', async () => {
      const appointment = await createTerminalAppointment('canceled');

      await expect(
        ctx.database.execute(
          sql`delete from appointments_services where appointment_id = ${appointment.id}`
        )
      ).rejects.toThrow();
    });

    test('allows when appointment is scheduled', async () => {
      const result = await appointmentRepository.insert({
        medspaId,
        startTime: new Date(Date.now() + 86_400_000),
        serviceIds: [serviceId],
      });
      expect.assert(result.status === 'created');

      await expect(
        ctx.database.execute(
          sql`delete from appointments_services where appointment_id = ${result.data.id}`
        )
      ).resolves.not.toThrow();
    });
  });
});
