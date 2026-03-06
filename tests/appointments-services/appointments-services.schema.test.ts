import { sql } from 'drizzle-orm';
import { createAppointment } from '../fixtures/create-appointment.ts';
import { createMedspa } from '../fixtures/create-medspa.ts';
import { createService } from '../fixtures/create-service.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let appointmentId: string;
let unusedServiceId: string;
let medspaId: string;

beforeAll(async () => {
  ctx = await createTestDatabase();

  const medspa = await createMedspa(ctx.database, {
    name: 'Check Test Spa',
    address: '111 Check Ave',
    phoneNumber: '+12125550111',
    email: 'check@spa.com',
  });
  medspaId = medspa.id;

  const usedService = await createService(ctx.database, medspaId, {
    name: 'Used Service',
    description: 'Used in the appointment',
  });

  const unusedService = await createService(ctx.database, medspaId, {
    name: 'Unused Service',
    description: 'Not attached to the appointment',
    price: 20000,
    duration: 45,
  });
  unusedServiceId = unusedService.id;

  const appointment = await createAppointment(ctx.database, medspaId, [
    usedService.id,
  ]);
  appointmentId = appointment.id;
}, 60_000);

afterAll(() => ctx.teardown());

describe('appointments_services', () => {
  describe('CONSTRAINTS', () => {
    describe('appointments_services_price_positive', () => {
      test('rejects INSERT with `price` = 0', async () => {
        await expect(
          ctx.database.execute(
            sql`INSERT INTO appointments_services (appointment_id, service_id, medspa_id, price, duration)
                VALUES (${appointmentId}, ${unusedServiceId}, ${medspaId}, 0, 30)`
          )
        ).rejects.toThrow();
      });

      test('rejects INSERT with negative `price`', async () => {
        await expect(
          ctx.database.execute(
            sql`INSERT INTO appointments_services (appointment_id, service_id, medspa_id, price, duration)
                VALUES (${appointmentId}, ${unusedServiceId}, ${medspaId}, -100, 30)`
          )
        ).rejects.toThrow();
      });
    });

    describe('appointments_services_duration_positive', () => {
      test('rejects INSERT with `duration` = 0', async () => {
        await expect(
          ctx.database.execute(
            sql`INSERT INTO appointments_services (appointment_id, service_id, medspa_id, price, duration)
                VALUES (${appointmentId}, ${unusedServiceId}, ${medspaId}, 10000, 0)`
          )
        ).rejects.toThrow();
      });

      test('rejects INSERT with negative `duration`', async () => {
        await expect(
          ctx.database.execute(
            sql`INSERT INTO appointments_services (appointment_id, service_id, medspa_id, price, duration)
                VALUES (${appointmentId}, ${unusedServiceId}, ${medspaId}, 10000, -30)`
          )
        ).rejects.toThrow();
      });
    });
  });
});
