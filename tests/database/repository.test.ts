import { ForeignKeyViolationError } from '@/database/errors/foreign-key-violation-error.ts';
import { RaiseExceptionError } from '@/database/errors/raise-exception-error.ts';
import { UniqueViolationError } from '@/database/errors/unique-violation-error.ts';
import { Repository } from '@/database/repository.ts';

vi.mock('@/database/database.ts');

const { database } = await import('@/database/database.ts');

class TestRepository extends Repository {
  async run<T>(operation: () => Promise<T>): Promise<T> {
    return this.execute(operation);
  }
}

const repository = new TestRepository(database);

function createDrizzleError(code: string, message: string): Error {
  return Object.assign(new Error('query failed'), {
    cause: Object.assign(new Error(message), { code }),
  });
}

describe('Repository', () => {
  describe('execute', () => {
    test('returns the result of the operation', async () => {
      const result = await repository.run(() => Promise.resolve('ok'));

      expect(result).toStrictEqual('ok');
    });

    test('throws `UniqueViolationError` for PG code `23505`', async () => {
      await expect(
        repository.run(() => {
          throw createDrizzleError('23505', 'unique violation');
        })
      ).rejects.toThrow(UniqueViolationError);
    });

    test('throws `ForeignKeyViolationError` for PG code `23503`', async () => {
      await expect(
        repository.run(() => {
          throw createDrizzleError('23503', 'foreign key violation');
        })
      ).rejects.toThrow(ForeignKeyViolationError);
    });

    test('throws `RaiseExceptionError` for PG code `P0001`', async () => {
      await expect(
        repository.run(() => {
          throw createDrizzleError('P0001', 'raise exception');
        })
      ).rejects.toThrow(RaiseExceptionError);
    });

    test('rethrows unknown errors', async () => {
      const error = new Error('something else');

      await expect(repository.run(() => Promise.reject(error))).rejects.toThrow(
        error
      );
    });

    test('rethrows non-Error values as-is', async () => {
      await expect(
        repository.run(() => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          return Promise.reject('string error');
        })
      ).rejects.toStrictEqual('string error');
    });
  });
});
