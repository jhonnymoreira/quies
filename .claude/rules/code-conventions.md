# Code conventions

- ESM project (`"type": "module"` in package.json)
- All code, comments, commit messages, and PR descriptions in English

## Module resolution

This project uses `moduleResolution: "node16"` with `allowImportingTsExtensions` enabled. All import paths must include the `.ts` extension:

```ts
// Correct
import { logger } from '@/shared/logger.ts';

// Wrong — missing extension, relative import
import { logger } from '../../shared/logger';
```

## Naming conventions

- **Domain files** use dot-separated naming: `<domain>.<type>.ts` (e.g., `medspas.schema.ts`, `medspas.repository.ts`)
- **Shared utilities** use kebab-case (e.g., `get-environment-variables.ts`, `request-validation.ts`)
- Always use **named exports** — never use `default` exports
- Always use **meaningful variable names** — avoid single-letter abbreviations (e.g., use `context` instead of `c` for Hono's context parameter)

```ts
// Correct
.get('/:id', requestValidation('param', selectMedspaSchema), async (context) => {
  const { id } = context.req.valid('param');
  const [medspa] = await medspaRepository.findMedspaById(id);
  if (!medspa) {
    return context.json(errorResponse('Medspa not found'), 404);
  }
  return context.json(successResponse(medspa));
})

// Wrong — single-letter variable
.get('/:id', requestValidation('param', selectMedspaSchema), async (c) => {
  const { id } = c.req.valid('param');
  // ...
})
```

## Domain structure

Each domain lives in its own folder under `src/` and follows a consistent file structure:

```
src/medspas/
  medspas.schema.ts      # Drizzle table definition + Zod validation schemas
  medspas.repository.ts  # Database query class
  medspas.ts             # Hono route handlers
```

Every domain table must be re-exported from `src/db/schema.ts` so Drizzle Kit can discover it:

```ts
// src/db/schema.ts
export { medspas } from '@/medspas/medspas.schema.ts';
```

## Import order

Imports are sorted automatically by Prettier — do not reorder manually.

## Validation

After completing all code changes for a task (not after each individual edit), run these commands before presenting the result:

1. `pnpm code:typecheck` — ensure no type errors
2. `pnpm code:lint` — ensure no lint violations
3. `pnpm code:prettify` — fix formatting

## Git workflow

- **Commit messages:** use [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, etc.)
- **Pre-commit hook:** runs lint-staged (Prettier + ESLint) and type-check
- **Pre-push hook:** runs all tests
- Husky hooks are installed automatically on `pnpm install`. If a pre-commit hook fails, fix the underlying issue — do not bypass with `--no-verify`.
