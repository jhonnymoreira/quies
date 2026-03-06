import { UniqueViolationError } from '@/database/errors/unique-violation-error.ts';
import { Repository } from '@/database/repository.ts';
import type { Created, Duplicate } from '@/database/result-types.ts';
import {
  type Medspa,
  type MedspaInsertSchema,
  medspas,
} from './medspas.schema.ts';

type MedspaInsertResult = Created<Medspa> | Duplicate<'address'>;

export class MedspaRepository extends Repository {
  async insert(medspa: MedspaInsertSchema): Promise<MedspaInsertResult> {
    try {
      const [row] = await this.execute(() =>
        this.database.insert(medspas).values(medspa).returning()
      );

      if (!row) {
        throw new Error('Insert returned no rows');
      }

      return { status: 'created', data: row };
    } catch (error) {
      if (error instanceof UniqueViolationError) {
        return { status: 'duplicate', constraint: 'address' };
      }

      throw error;
    }
  }
}
