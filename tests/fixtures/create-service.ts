import { ServiceRepository } from '@/services/services.repository.ts';
import type { ServiceInsertSchema } from '@/services/services.schema.ts';
import type { TestDatabase } from '../helpers/create-test-database.ts';

export async function createService(
  database: TestDatabase,
  medspaId: string,
  overrides?: Partial<Omit<ServiceInsertSchema, 'medspaId'>>
) {
  const result = await new ServiceRepository(database).insert({
    name: 'Test Service',
    description: 'A test service',
    price: 10000,
    duration: 30,
    medspaId,
    ...overrides,
  });
  if (result.status !== 'created') {
    throw new Error(`Expected service to be created, got: ${result.status}`);
  }
  return result.data;
}
