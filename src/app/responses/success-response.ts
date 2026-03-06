export class SuccessResponse<T> {
  readonly success = true as const;
  readonly data: T;

  constructor(data: T) {
    this.data = data;
  }
}
