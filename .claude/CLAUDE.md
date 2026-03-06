# CLAUDE.md

## Project overview

medspa-api is a Node.js REST API built with Hono, TypeScript, Drizzle ORM, and PostgreSQL.

## Stack

- **Runtime:** Node.js 24 (see `.nvmrc`)
- **Language:** TypeScript 5.9+ (strict mode via `@tsconfig/node24` + `@tsconfig/strictest`)
- **Framework:** Hono with `@hono/node-server`
- **ORM:** Drizzle ORM with PostgreSQL (`postgres` driver)
- **Validation:** Zod v4 + drizzle-zod
- **Logging:** pino + pino-http (pino-pretty in dev)
- **Package manager:** pnpm
- **Build:** esbuild (output in `dist/`)
- **Testing:** Vitest with `@vitest/coverage-v8`

## Setup

```sh
# Start PostgreSQL
docker compose up -d

# Copy env and set DATABASE_URL
cp .env.example .env

# Install dependencies (also sets up Husky hooks)
pnpm install

# Push DB schema
pnpm db:push
```

## Common commands

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `pnpm start`          | Run dev server (tsx)           |
| `pnpm build`          | Build with esbuild             |
| `pnpm test`           | Run tests                      |
| `pnpm test:watch`     | Run tests in watch mode        |
| `pnpm test:coverage`  | Run tests with coverage        |
| `pnpm code:lint`      | Lint with ESLint               |
| `pnpm code:prettify`  | Format with Prettier           |
| `pnpm code:typecheck` | Type-check (no emit)           |
| `pnpm db:drop`        | Drop Drizzle migration         |
| `pnpm db:generate`    | Generate Drizzle migrations    |
| `pnpm db:migrate`     | Run Drizzle migrations         |
| `pnpm db:push`        | Push schema changes to DB      |
| `pnpm db:studio`      | Open Drizzle Studio            |
| `pnpm db:up`          | Apply Drizzle schema snapshots |
| `pnpm prepare`        | Install Husky git hooks        |

Always use `pnpm <script>` (not `pnpm run`). For binaries, use `pnpm exec <binary>` (not `npx`).

## Code conventions

See `.claude/rules/code-conventions.md` for full details (module resolution, import order, validation commands, git workflow).

## Project structure

```
src/
  index.ts              # Server start (listen on port)
  app/                  # Hono app setup, middleware, factory
    app.ts              # Routes, middleware, error handlers
    app-env.ts          # Hono env types (Bindings, Variables)
    factory.ts          # Hono factory with AppEnv
    logger.ts           # pino logger
    get-environment-variables.ts
    middlewares/
      request-validation.ts
    responses/
      success-response.ts
      error-response.ts
  database/
    schema.ts           # Re-exports all domain tables for Drizzle Kit
    database.ts         # Database connection (direct export)
    repository.ts       # Base repository
    result-types.ts     # Shared result type definitions
    timestamps.ts       # Reusable Drizzle timestamp columns
    handle-database-error.ts
    errors/
      unique-violation-error.ts
      foreign-key-violation-error.ts
      raise-exception-error.ts
    __mocks__/
      database.ts       # Database mock for unit tests
  medspas/              # Domain: medspas
    medspas.schema.ts
    medspas.repository.ts
    medspas.ts          # Route handlers (+ nested services/appointments)
  services/             # Domain: services
    services.schema.ts
    services.repository.ts
    services.ts
  appointments/         # Domain: appointments
    appointments.schema.ts
    appointments.repository.ts
    appointments.ts
  appointments-services/ # Domain: appointments-services (many-to-many)
    appointments-services.schema.ts
tests/                  # All test files
  medspas/              # Medspa domain tests (repository + routes)
  services/             # Service domain tests (repository + routes)
  appointments/         # Appointment domain tests (repository + routes)
  migrations/           # Custom SQL migration tests (triggers, constraints)
  fixtures/             # Shared test data factories (create-medspa, etc.)
  helpers/              # Test infrastructure (create-test-database)
drizzle/
  migrations/           # Auto-generated + custom SQL migrations
docs/                   # API docs (schema, endpoints, usage)
```

## Testing

See `.claude/rules/testing.md` for conventions.

## Database

See `.claude/rules/database.md` for conventions.

## Environment variables

All environment variables must be parsed and validated through a Zod schema at startup (in `src/app/get-environment-variables.ts`). Do not access `process.env` directly elsewhere.

## Dependencies

Prefer native Node.js APIs and existing dependencies over adding new packages. Add new packages when they genuinely add value.

## Git workflow

See `.claude/rules/code-conventions.md` for commit conventions and hook behavior.

## Skills

- `/hono` — Hono framework docs, search, and request testing via the Hono CLI (`pnpm exec hono`)
- `/drizzle-docs [question]` — Look up Drizzle ORM documentation
- `/zod-docs [question]` — Look up Zod validation library documentation
