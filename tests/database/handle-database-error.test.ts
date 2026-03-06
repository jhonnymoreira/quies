import { ForeignKeyViolationError } from '@/database/errors/foreign-key-violation-error.ts';
import { RaiseExceptionError } from '@/database/errors/raise-exception-error.ts';
import { UniqueViolationError } from '@/database/errors/unique-violation-error.ts';
import { handleDatabaseError } from '@/database/handle-database-error.ts';

describe('handleDatabaseError', () => {
  test('throws UniqueViolationError for code `23505`', () => {
    const pgError = Object.assign(new Error('unique violation'), {
      code: '23505',
    });
    const drizzleError = Object.assign(new Error('query failed'), {
      cause: pgError,
    });

    expect(() => handleDatabaseError(drizzleError)).toThrow(
      UniqueViolationError
    );
  });

  test('throws ForeignKeyViolationError for code `23503`', () => {
    const pgError = Object.assign(new Error('foreign key violation'), {
      code: '23503',
    });
    const drizzleError = Object.assign(new Error('query failed'), {
      cause: pgError,
    });

    expect(() => handleDatabaseError(drizzleError)).toThrow(
      ForeignKeyViolationError
    );
  });

  test('throws RaiseExceptionError for code `P0001`', () => {
    const pgError = Object.assign(new Error('raise exception'), {
      code: 'P0001',
    });
    const drizzleError = Object.assign(new Error('query failed'), {
      cause: pgError,
    });

    expect(() => handleDatabaseError(drizzleError)).toThrow(
      RaiseExceptionError
    );
  });

  test('rethrows the original error for unknown codes', () => {
    const drizzleError = Object.assign(new Error('query failed'), {
      cause: Object.assign(new Error('unknown'), { code: '99999' }),
    });

    expect(() => handleDatabaseError(drizzleError)).toThrow(Error);
  });

  test('falls back to error itself when `cause` is not an Error', () => {
    const error = Object.assign(new Error('direct pg error'), {
      code: '23505',
    });

    expect(() => handleDatabaseError(error)).toThrow(UniqueViolationError);
  });

  test('rethrows non-Error values as-is', () => {
    const value = { custom: 'error' };

    expect(() => handleDatabaseError(value)).toThrow();
  });
});
