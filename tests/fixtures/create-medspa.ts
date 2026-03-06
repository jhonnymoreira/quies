import { MedspaRepository } from '@/medspas/medspas.repository.ts';
import type { MedspaInsertSchema } from '@/medspas/medspas.schema.ts';
import type { TestDatabase } from '../helpers/create-test-database.ts';

export async function createMedspa(
  database: TestDatabase,
  overrides?: Partial<MedspaInsertSchema>
) {
  const result = await new MedspaRepository(database).insert({
    name: 'Test Spa',
    address: '123 Test Ave',
    phoneNumber: '+12125550000',
    email: 'test@spa.com',
    ...overrides,
  });
  if (result.status !== 'created') {
    throw new Error(`Expected medspa to be created, got: ${result.status}`);
  }
  return result.data;
}
