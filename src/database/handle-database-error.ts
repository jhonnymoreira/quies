import { ForeignKeyViolationError } from './errors/foreign-key-violation-error.ts';
import { RaiseExceptionError } from './errors/raise-exception-error.ts';
import { UniqueViolationError } from './errors/unique-violation-error.ts';

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

export function handleDatabaseError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  const pgCause = error.cause instanceof Error ? error.cause : error;

  if (hasCode(pgCause, '23505')) {
    throw new UniqueViolationError(pgCause, error);
  }

  if (hasCode(pgCause, '23503')) {
    throw new ForeignKeyViolationError(pgCause, error);
  }

  if (hasCode(pgCause, 'P0001')) {
    throw new RaiseExceptionError(pgCause, error);
  }

  throw error;
}
