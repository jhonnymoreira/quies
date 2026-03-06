---
paths:
    - 'src/db/**/*.ts'
    - 'src/**/*.repository.ts'
    - 'src/**/*.schema.ts'
    - 'drizzle/**'
---

# Database

- PostgreSQL 17 via Docker Compose (port 5432)
- Drizzle ORM for schema definition and queries
- **Repository pattern:** each domain has its own repository class (e.g., `src/medspas/medspas.repository.ts`) that receives the database instance via constructor injection
- Schema defined per domain (e.g., `src/medspas/medspas.schema.ts`) and re-exported from `src/db/schema.ts`
- Connection string via `DATABASE_URL` environment variable
- Every custom SQL migration must have a corresponding test file under `tests/migrations/<migration-name>.test.ts` (see testing rules for the pattern)
