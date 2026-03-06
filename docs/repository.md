# Repository contracts

Discriminated result types for each repository method. Every outcome is explicit and typed — the repository tells you **what** happened, the handler decides **how** to respond.

Soft-deleted records are treated as non-existent by design. Data retention is handled by separate routines outside the repository contract.

## Result statuses

| Status                | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| `created`             | Insert succeeded                               |
| `updated`             | Update succeeded                               |
| `found`               | Query matched                                  |
| `not_found`           | No rows matched (includes soft-deleted)        |
| `duplicate`           | Unique constraint violated                     |
| `reference_not_found` | Foreign key reference doesn't exist            |
| `status_conflict`     | Operation rejected due to current entity state |

---

## MedspaRepository

### `insert(data: MedspaInsertSchema)`

```ts
type MedspaInsertResult =
    | { status: 'created'; data: Medspa }
    | { status: 'duplicate'; constraint: 'address' };
```

| Status      | Detail                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `created`   | Medspa persisted with all fields populated (`id`, `name`, `address`, `phoneNumber`, `email`, timestamps). |
| `duplicate` | Another medspa already uses this `address`.                                                               |

---

## ServiceRepository

### `insert(data: ServiceInsertSchema)`

```ts
type ServiceInsertResult =
    | { status: 'created'; data: Service }
    | { status: 'duplicate'; constraint: 'medspa_id_name' }
    | { status: 'reference_not_found'; field: 'medspaId' };
```

| Status                | Detail                                                         |
| --------------------- | -------------------------------------------------------------- |
| `created`             | Service persisted.                                             |
| `duplicate`           | A service with the same `name` already exists for this medspa. |
| `reference_not_found` | The given `medspaId` doesn't reference an existing medspa.     |

### `update(serviceId: Service['id'], data: ServiceUpdateSchema)`

```ts
type ServiceUpdateResult =
    | { status: 'updated'; data: Service }
    | { status: 'not_found' }
    | { status: 'duplicate'; constraint: 'medspa_id_name' };
```

| Status      | Detail                                                                |
| ----------- | --------------------------------------------------------------------- |
| `updated`   | Service modified. Matched on `id` where `deletedAt IS NULL`.          |
| `not_found` | No active service with this `id`.                                     |
| `duplicate` | The updated `name` conflicts with another service in the same medspa. |

### `findById(serviceId: Service['id'])`

```ts
type ServiceFindByIdResult =
    | { status: 'found'; data: Service }
    | { status: 'not_found' };
```

| Status      | Detail                            |
| ----------- | --------------------------------- |
| `found`     | Active service matched.           |
| `not_found` | No active service with this `id`. |

### `findAllByMedspaId(medspaId: Medspa['id'])`

```ts
type ServiceFindAllByMedspaIdResult =
    | { status: 'found'; data: Service[] }
    | { status: 'reference_not_found'; field: 'medspaId' };
```

| Status                | Detail                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `found`               | All active services for this medspa. `data` may be empty if the medspa exists but has no services. |
| `reference_not_found` | The given `medspaId` doesn't reference an existing medspa.                                         |

---

## AppointmentRepository

### `insert(data: AppointmentInsertSchema)`

```ts
type AppointmentInsertResult =
    | { status: 'created'; data: Appointment }
    | { status: 'reference_not_found'; field: 'medspaId' }
    | {
          status: 'reference_not_found';
          field: 'serviceIds';
          missingIds: string[];
      };
```

| Status                             | Detail                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `created`                          | Appointment persisted with `status: 'scheduled'`, computed `totalPrice`/`totalDuration`, `scheduledAt` defaulted to now, `completedAt: null`, `canceledAt: null`. Junction rows inserted with price/duration snapshots. |
| `reference_not_found` (medspaId)   | The given `medspaId` doesn't reference an existing medspa.                                                                                                                                                              |
| `reference_not_found` (serviceIds) | One or more `serviceIds` not found for this medspa (non-existent, belong to a different medspa, or soft-deleted). `missingIds` lists which ones.                                                                        |

> **Open question:** Should `medspaId` and `serviceIds` reference failures be separate statuses or unified under one? Separating them gives the caller precise context. Unifying simplifies the type but loses specificity.

### `update(appointmentId: Appointment['id'], data: AppointmentUpdateSchema)`

```ts
type AppointmentUpdateResult =
    | { status: 'updated'; data: Appointment }
    | { status: 'not_found' }
    | { status: 'status_conflict'; currentStatus: 'completed' | 'canceled' };
```

| Status            | Detail                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `updated`         | Status changed and corresponding timestamp (`completedAt` or `canceledAt`) set.               |
| `not_found`       | No active appointment with this `id`.                                                         |
| `status_conflict` | Appointment exists but is already `completed` or `canceled`. `currentStatus` tells you which. |

### `findAll()`

```ts
type AppointmentFindAllResult = Appointment[];
```

Returns all active appointments. Empty array if none exist. No error cases — this method always succeeds.

### `findById(appointmentId: Appointment['id'])`

```ts
type AppointmentFindByIdResult =
    | { status: 'found'; data: Appointment }
    | { status: 'not_found' };
```

| Status      | Detail                                |
| ----------- | ------------------------------------- |
| `found`     | Active appointment matched.           |
| `not_found` | No active appointment with this `id`. |
