export class ErrorResponse {
  readonly success = false as const;
  readonly error: { message: string; issues?: readonly unknown[] };

  constructor(message: string, issues?: readonly unknown[]) {
    this.error = issues ? { message, issues } : { message };
  }
}
