# Quies

> _quies_ from Latin: rest, peace, calm

A type-safe medspa management API using Node.js, TypeScript, Hono, Drizzle and Zod, heavily focused on Data Integrity and AI standards.

---

## Table of Contents

- [Setup instructions](#setup-instructions)
- [API examples](#api-examples)
- [AI Usage](#ai-usage)
- [Assumptions](#assumptions)
- [Tradeoffs](#tradeoffs)
- [SQL migrations](#sql-migrations)
- [Scope decisions](#scope-decisions)
- [Scope Change Scenario](#scope-change-scenario)

---

## Setup instructions

### Requirements

- Docker and Docker Compose
  <!-- - Node.js v24 (`nvm` is recommended and supported) -->
  <!-- - `pnpm` (via `corepack enable pnpm`) -->

### How to run

1. Create a `.env`. You can do that by running:
    ```sh
    cp .env.example .env
    ```
1. Start the server:
    ```sh
    docker compose up --build
    ```
1. Run the migrations
    ```sh
    docker compose exec app pnpm db:migrate
    ```

The API should be accessible at http://localhost:3000

---

## API examples

For all the endpoints available, their responses and curl commands, see [the API usage document](./docs/api-usage.md)

---

## AI Usage

The whole project was designed thinking of AI as the multiplier factor. To make this work, specially with Claude Code (the chosen tool), safety-nets were added to the project:

- Claude Code setup ([`.claude/`](./.claude/))
    - Rules ([`.claude/rules/`](./.claude/rules/))
        - [`code-conventions.md`](./.claude/rules/code-conventions.md) with the overall coding rules to follow
        - [`database.md`](./.claude/rules/database.md) with the database and ORM details
        - [`testing.md`](./.claude/rules/testing.md) with the testings standards
    - Skills ([`.claude/skills/`](./.claude/skills/))
        - `/drizzle-docs` ([source](./.claude/skills/drizzle-docs/SKILL.md)) to interact directly with the ORM documentation
        - `/hono` ([source](./.claude/skills/hono/SKILL.md)) to interact with the `@hono/cli`
        - `/zod-docs` ([source](./.claude/skills/zod-docs/SKILL.md)) to interact directly with the Zod documentation
    - CLAUDE.md ([`.claude/CLAUDE.md`](./.claude/CLAUDE.md)) to hold the overall knowledge of the codebase and better navigate it
    - `settings.json` ([source](./.claude/settings.json)) to control the permissions of what can be used and fetched
- Code quality tools (ESLint, Prettier, EditorConfig)
- Automated tests (Vitest)
- Git Hooks enforcing the code quality and preventing the submission of broken code
- Documents ([`docs/`](./docs/)) with the specs to drive the agentic delivery

This setup was key to ensure the focus was on the data modelling, the API contracts, and product definition.

---

## Assumptions

- We had a dependency on `medspaId` across the project, as a result, one more endpoint was added to create a medspa (`POST /medspas`).
- Appointments and Services should store snapshots of the current data on `appointments_services`, meaning that any updates of a service won't affect the previously created appointments.
- Appointment status is a state-machine with two terminal states: `completed` and `canceled`. Where:
    - When an appointment is created, it automatically becomes a `scheduled` appointment
    - Updates to a `scheduled` appointment are allowed
    - A `scheduled` appointment can only transition to either `completed` or `canceled` status
    - A `completed` appointment **should not** transition (terminal-state)
    - A `canceled` appointment **should not** transition (terminal-state)
    - An appointment with `canceled` or `completed` status should only be able to update the `deleted_at` field (soft-delete approach)
- An appointment `total_duration` (sum of `services`.`duration`) and `total_price` (sum of `services`.`price`) **must** reflect the state of the `services` at the appointment creation. Any further updates, if allowed, should have this same behavior.
- Medspas email and phone number are not unique-constrained because multiple locations under the same ownership may share contact details.

## Tradeoffs

- Node.js/TypeScript with Hono in this app, instead of Python with Flask (or FastAPI), due to my familiarity with the JavaScript environment, allowing me to move faster, and spec the application behavior correctly (type-safe, focused on data integrity).
- Direct usage of `tsx` to run the application in the Docker entrypoints to avoid a build process.
- ORM usage (via Drizzle) for end-to-end type-safety and using the database as the source-of-truth.
- Heavy usage of procedures and triggers to ensure that the data logic lives directly in the database, while reinforcing it at the application level. See [SQL migrations](#sql-migrations) for details.
- Unit testing and integration testing with `testcontainers` (PostgreSQL containers)

---

## SQL migrations

Custom SQL migrations live in [`drizzle/migrations/`](./drizzle/migrations/) and enforce data integrity at the database level:

| Migration                                                                                                   | Description                                                                                                         |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`0001_not_empty_constraints`](./drizzle/migrations/0001_not_empty_constraints.sql)                         | `CHECK` constraints ensuring non-empty trimmed values on `medspas` and `services` columns                           |
| [`0002_description_max_length`](./drizzle/migrations/0002_description_max_length.sql)                       | `CHECK` constraint limiting `services.description` to 500 characters                                                |
| [`0003_freeze_terminal_appointments`](./drizzle/migrations/0003_freeze_terminal_appointments.sql)           | Trigger preventing updates on `completed`/`canceled` appointments (except soft-delete)                              |
| [`0004_validate_appointment_start_time`](./drizzle/migrations/0004_validate_appointment_start_time.sql)     | Trigger ensuring `appointments.start_time` is in the future on insert and update                                    |
| [`0005_guard_appointment_services_status`](./drizzle/migrations/0005_guard_appointment_services_status.sql) | Trigger preventing insert/delete on `appointments_services` when the appointment is not `scheduled`                 |
| [`0006_set_updated_at`](./drizzle/migrations/0006_set_updated_at.sql)                                       | Trigger auto-setting `updated_at` on row updates for `medspas`, `services`, and `appointments`                      |
| [`0007_soft_delete`](./drizzle/migrations/0007_soft_delete.sql)                                             | Trigger converting `DELETE` into a soft-delete (`deleted_at = NOW()`) for `medspas`, `services`, and `appointments` |

---

## Scope decisions

- Intentionally left out of the scope to focus on the data modelling and product behavior:
    - No caching.
    - No pagination on list endpoints.
    - No auth layer in the application.
- No production build, due to the time constraint (even with a base `esbuild.config.ts` to handle that in the future).

---

## Scope Change Scenario

A PM pings you late in the build:

> "Can we add a `customer_notes` field to appointments so customers can leave special instructions?"

- What would you change in your implementation?
- How would you communicate and handle this in a real scenario?

### Scope Change Answer

#### Context

Adding a `customer_notes` to an appointment is a valid feature, and I'd try to get more data out of this request:

- What is the problem that we are trying to solve? A few scenarios come to mind:
    - Improving the current appointment schedule flow
    - Indicating pre-existent conditions from a customer
- How many businesses are requesting this feature? Are there any high-value or high-priority business asking for it?

With this data in mind, we can prioritize accordingly based on the team capacity, and understand if there are any lessons we could learn to improve our process.

#### Real scenario communication

> Heya, could you please help us here by answering a few questions first?
>
> 1. What are we trying to solve exactly?
> 2. Was this requested by any customers before?
> 3. Are there any high-value/high-priority customers asking for it?
> 4. How many customers are requesting it?
>
> Thank you!

And based on that conversation, we could also negotiate for an MVP at first, and implement this feature later when the team has more capacity.

#### Implementation changes

As for what would I change in my current implementation to support this feature:

- Create a migration to add the `customer_notes` field (`TEXT NULLABLE`) to the table `appointments`
- Add a `CHECK` constraint on max length of `appointments.customer_notes` (adjustable length without messing up the data type)
- Replicate the `appointments.customer_notes` max length check on `appointmentInsertSchema` via Zod
- Accept `customer_notes` as an optional field in `POST /medspas/:medspaId/appointments` and `PATCH /appointments/:appointmentId` (while still `scheduled`)
- Create a migration to update the `prevent_terminal_appointment_update()` function to include `customer_notes` in the frozen column set, preventing updates on `canceled` or `completed` appointments
- Add repository and route tests covering the new field: creation with and without notes, presence in responses, and rejection on terminal appointment updates
