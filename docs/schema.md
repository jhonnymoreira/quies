## Timestamps

- `created_at`: iso datetime, non-nullable, filled automatically at creation
- `updated_at`: iso datetime, non-nullable, filled automatically at creation/update
- `deleted_at`: iso datetime, nullable by default, filled automatically on deletion (soft-delete)

## Soft-delete strategy

Soft-deleted records (`deleted_at IS NOT NULL`) are excluded from all list/query endpoints but remain in the database for historical reference and GDPR-compliant data retention.

- **Medspas, Services**: use `deleted_at` from Timestamps. Soft-deleted records stop appearing in queries but are still referenced by historical appointment data via `appointments_services` snapshots.
- **Appointments**: use their own `deleted_at` for GDPR archival/removal, separate from the `canceled_at` business state. Cancellation is a business action; deletion is a data lifecycle action.
- **Appointment Services**: no `deleted_at`. Lifecycle is tied to the parent appointment — rows are filtered out when the parent appointment is soft-deleted.

## Medspas

**Table name:** `medspas`

**Properties:**

- `id` (uuid, random, automatically generated, index)
- `name` (string, not empty, required)
- `address` (string, not empty, required)
- `phone_number` (string, not empty, required)
- `email` (string with email validation, not empty, required)
- Extends Timestamps

**Constraints:**

- Unique on `(address)` — each address can only have one medspa

**Relationships:**

- medspas -> services: one-to-many
- medspas -> appointments: one-to-many

## Services

**Table name:** `services`
**Properties:**

- `id` (uuid, random, automatically generated, index)
- `name` (string, not empty, required)
- `description` (string, not empty, required)
- `price` (in cents) (int, greater than 0, required)
- `duration` (in minutes) (int, greater than 0, required)
- `medspa_id` (medspas.id, required, foreign-key)
- Extends Timestamps

**Constraints:**

- Unique on `(medspa_id, name)` — each service name must be unique within a medspa
- Unique on `(id, medspa_id)` — required for composite FK from `appointments_services`

**Relationships:**

- services <-> appointments: many-to-many (via `appointments_services`)

## Appointment Services

**Table name:** `appointments_services`

**Properties:**

- `appointment_id` (appointments.id, required, foreign-key, composite primary key)
- `service_id` (services.id, required, foreign-key, composite primary key)
- `medspa_id` (medspas.id, required) — shared by both composite foreign keys below
- `price` (in cents) (int, greater than 0, required) — snapshot of service.price at booking time
- `duration` (in minutes) (int, greater than 0, required) — snapshot of service.duration at booking time

**Constraints:**

- Composite FK `(appointment_id, medspa_id)` → `appointments(id, medspa_id)` — ensures appointment belongs to the medspa
- Composite FK `(service_id, medspa_id)` → `services(id, medspa_id)` — ensures service belongs to the same medspa
- DB-level guarantee that services and appointments in the same row always share the same medspa
- TRIGGER (BEFORE INSERT): rejects insert if parent appointment status is not `scheduled`
- TRIGGER (BEFORE DELETE): rejects delete if parent appointment status is not `scheduled`

**Relationships:**

- appointments_services -> appointments: many-to-one
- appointments_services -> services: many-to-one

## Appointments

**Table name:** `appointments`
**Properties:**

- `id` (uuid, random, automatically generated, index)
- `medspa_id` (medspas.id, required, foreign-key)
- `start_time` (iso datetime, required)
    - cannot be in the past
- `status`: `scheduled`, `completed`, `canceled`, defaults to `scheduled`
  -> `scheduled` can only transition to either `completed` or `canceled`
  -> `completed` can't transition to `scheduled` or `canceled`
  -> `canceled` can't transition to `scheduled` or `completed`
- `total_duration` (int, required) — server-computed as `SUM(appointments_services.duration)` on create and update
- `total_price` (int, required) — server-computed as `SUM(appointments_services.price)` on create and update
- `scheduled_at` (iso datetime, non-nullable, filled automatically at creation)
- `completed_at` (iso datetime, nullable, set when status transitions to `completed`)
- `canceled_at` (iso datetime, nullable, set when status transitions to `canceled`)
- `updated_at` (iso datetime, non-nullable, filled automatically at creation/update)
- `deleted_at` (iso datetime, nullable, for GDPR data archival/removal)

**Constraints:**

- Unique on `(id, medspa_id)` — required for composite FK from `appointments_services`
- CHECK: `status` only allows `'scheduled'`, `'completed'`, `'canceled'`
- CHECK: `total_duration > 0` and `total_price > 0` — an appointment must have at least one service
- CHECK: status and lifecycle timestamps must be consistent:
    - `status = 'scheduled'` → `scheduled_at IS NOT NULL`, `completed_at IS NULL`, `canceled_at IS NULL`
    - `status = 'completed'` → `scheduled_at IS NOT NULL`, `completed_at IS NOT NULL`, `canceled_at IS NULL`
    - `status = 'canceled'` → `scheduled_at IS NOT NULL`, `completed_at IS NULL`, `canceled_at IS NOT NULL`
- TRIGGER (BEFORE INSERT): `start_time` must not be in the past (`start_time >= NOW()`)
- TRIGGER (BEFORE UPDATE): `start_time` must not be in the past if changed (`start_time >= NOW()`)
- TRIGGER (BEFORE UPDATE): status transition enforcement — `'scheduled'` can only move to `'completed'` or `'canceled'`; `'completed'` and `'canceled'` are terminal states and cannot transition further
- TRIGGER (BEFORE UPDATE): only `scheduled` appointments can update `start_time`; `completed` and `canceled` appointments are fully locked except for `deleted_at` (GDPR)

**Relationships:**

- appointments <-> services: many-to-many (via `appointments_services`)
