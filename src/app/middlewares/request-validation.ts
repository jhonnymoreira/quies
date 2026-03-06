import { sValidator } from '@hono/standard-validator';
import type { ValidationTargets } from 'hono';
import { ErrorResponse } from '@/app/responses/error-response.ts';

type StandardSchema = Parameters<typeof sValidator>[1];

export function requestValidation<
  Target extends keyof ValidationTargets,
  Schema extends StandardSchema,
>(target: Target, schema: Schema) {
  return sValidator(target, schema, (result, context) => {
    if (!result.success) {
      return context.json(
        new ErrorResponse('Validation failed', result.error),
        400
      );
    }
    return undefined;
  });
}
