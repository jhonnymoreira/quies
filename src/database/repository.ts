import type { Database } from './database.ts';
import { handleDatabaseError } from './handle-database-error.ts';

export abstract class Repository {
  constructor(protected database: Database) {}

  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}
