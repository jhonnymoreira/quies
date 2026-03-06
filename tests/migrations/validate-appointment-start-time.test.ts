import { sql } from 'drizzle-orm';
import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
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

beforeAll(async () => {
  ctx = await createTestDatabase();
  appointmentRepository = new AppointmentRepository(ctx.database);

  const medspa = await createMedspa(ctx.database, {
    name: 'Start Time Trigger Spa',
    address: '100 Time Ave',
    phoneNumber: '+12125558888',
    email: 'time@spa.com',
  });
  medspaId = medspa.id;

  const service = await createService(ctx.database, medspaId, {
    name: 'Time Service',
    description: 'A service for time trigger tests',
  });
  serviceId = service.id;
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table appointments cascade`);
});

afterAll(() => ctx.teardown());

describe('validate_appointment_start_time trigger', () => {
  test('rejects INSERT when `start_time` is in the past', async () => {
    const pastDate = new Date(Date.now() - 86_400_000);

    await expect(
      ctx.database.execute(
        sql`insert into appointments (medspa_id, start_time, total_duration, total_price)
            values (${medspaId}, ${pastDate.toISOString()}, 30, 10000)`
      )
    ).rejects.toThrow();
  });

  test('allows INSERT when `start_time` is in the future', async () => {
    const result = await appointmentRepository.insert({
      medspaId,
      startTime: new Date(Date.now() + 86_400_000),
      serviceIds: [serviceId],
    });

    expect(result.status).toBe('created');
  });

  test('rejects UPDATE of `start_time` to a past value', async () => {
    const result = await appointmentRepository.insert({
      medspaId,
      startTime: new Date(Date.now() + 86_400_000),
      serviceIds: [serviceId],
    });
    expect.assert(result.status === 'created');

    const pastDate = new Date(Date.now() - 86_400_000);

    await expect(
      ctx.database.execute(
        sql`update appointments set start_time = ${pastDate.toISOString()} where id = ${result.data.id}`
      )
    ).rejects.toThrow();
  });

  test('allows UPDATE of `start_time` to a future value', async () => {
    const result = await appointmentRepository.insert({
      medspaId,
      startTime: new Date(Date.now() + 86_400_000),
      serviceIds: [serviceId],
    });
    expect.assert(result.status === 'created');

    const futureDate = new Date(Date.now() + 172_800_000);

    await expect(
      ctx.database.execute(
        sql`update appointments set start_time = ${futureDate.toISOString()} where id = ${result.data.id}`
      )
    ).resolves.not.toThrow();
  });
});
