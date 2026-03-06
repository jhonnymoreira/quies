import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import type { AppointmentInsertSchema } from '@/appointments/appointments.schema.ts';
import type { TestDatabase } from '../helpers/create-test-database.ts';

export async function createAppointment(
  database: TestDatabase,
  medspaId: string,
  serviceIds: string[],
  overrides?: Partial<Omit<AppointmentInsertSchema, 'medspaId' | 'serviceIds'>>
) {
  const result = await new AppointmentRepository(database).insert({
    medspaId,
    startTime: new Date(Date.now() + 86_400_000),
    serviceIds,
    ...overrides,
  });
  if (result.status !== 'created') {
    throw new Error(
      `Expected appointment to be created, got: ${result.status}`
    );
  }
  return result.data;
}
