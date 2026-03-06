export class RaiseExceptionError extends Error {
  override name = 'RaiseExceptionError';

  declare code: string;
  declare query: string;
  declare params: unknown[];

  constructor(pgError: Error, drizzleError: Error) {
    super(pgError.message);
    Object.assign(this, pgError, {
      query: 'query' in drizzleError ? drizzleError.query : '',
      params: 'params' in drizzleError ? drizzleError.params : [],
    });
    Error.captureStackTrace(this, RaiseExceptionError);
  }
}
