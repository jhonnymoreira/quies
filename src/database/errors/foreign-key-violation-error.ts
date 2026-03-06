export class ForeignKeyViolationError extends Error {
  override name = 'ForeignKeyViolationError';

  declare code: string;
  declare detail: string;
  declare constraint_name: string;
  declare table_name: string;
  declare schema_name: string;
  declare query: string;
  declare params: unknown[];

  constructor(pgError: Error, drizzleError: Error) {
    super(pgError.message);
    Object.assign(this, pgError, {
      query: 'query' in drizzleError ? drizzleError.query : '',
      params: 'params' in drizzleError ? drizzleError.params : [],
    });
    Error.captureStackTrace(this, ForeignKeyViolationError);
  }
}
