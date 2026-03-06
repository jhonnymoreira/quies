# API Usage

## `POST /medspas`

### Request

| Field         | Type   | Required | Description               |
| ------------- | ------ | -------- | ------------------------- |
| `name`        | string | yes      | Name of the medspa        |
| `address`     | string | yes      | Physical address (unique) |
| `phoneNumber` | string | yes      | Contact phone number      |
| `email`       | string | yes      | Valid email address       |

**201** — Created

```sh
curl -X POST http://localhost:3000/medspas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Glow Spa",
    "address": "123 Main St, New York, NY 10001",
    "phoneNumber": "+12125551234",
    "email": "hello@glowspa.com"
  }'
```

```json
{
    "success": true,
    "data": {
        "id": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "name": "Glow Spa",
        "address": "123 Main St, New York, NY 10001",
        "phoneNumber": "+12125551234",
        "email": "hello@glowspa.com",
        "createdAt": "2026-03-02T05:09:47.958Z",
        "updatedAt": "2026-03-02T05:09:47.958Z",
        "deletedAt": null
    }
}
```

**409** — Duplicate address

```sh
curl -X POST http://localhost:3000/medspas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Spa",
    "address": "123 Main St, New York, NY 10001",
    "phoneNumber": "+19995551234",
    "email": "other@spa.com"
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Medspa already exists."
    }
}
```

**400** — Validation error

```sh
curl -X POST http://localhost:3000/medspas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bad Spa",
    "address": "456 Other St",
    "phoneNumber": "+12125551234",
    "email": "not-an-email"
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "string",
                "code": "invalid_format",
                "format": "email",
                "pattern": "/^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$/",
                "path": ["email"],
                "message": "Invalid email address"
            }
        ]
    }
}
```

---

## `POST /medspas/:medspaId/services`

### Request

| Location | Field         | Type    | Required | Description                      |
| -------- | ------------- | ------- | -------- | -------------------------------- |
| param    | `medspaId`    | uuid    | yes      | Medspa ID                        |
| body     | `name`        | string  | yes      | Service name (unique per medspa) |
| body     | `description` | string  | yes      | Service description              |
| body     | `price`       | integer | yes      | Price in cents (min: 1)          |
| body     | `duration`    | integer | yes      | Duration in minutes (min: 1)     |

**201** — Created

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Botox",
    "description": "Botox injection",
    "price": 30000,
    "duration": 30
  }'
```

```json
{
    "success": true,
    "data": {
        "id": "4b3c4ed0-d9d1-476a-9b09-118f65b63398",
        "name": "Botox",
        "description": "Botox injection",
        "price": 30000,
        "duration": 30,
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "createdAt": "2026-03-02T05:10:30.294Z",
        "updatedAt": "2026-03-02T05:10:30.294Z",
        "deletedAt": null
    }
}
```

**409** — Duplicate name within medspa

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Botox",
    "description": "Another botox",
    "price": 25000,
    "duration": 20
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Service already exists."
    }
}
```

**404** — Medspa not found

```sh
curl -X POST http://localhost:3000/medspas/a0000001-0000-4000-8000-000000000001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Botox",
    "description": "Botox injection",
    "price": 30000,
    "duration": 30
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Medspa not found."
    }
}
```

**400** — Validation error

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filler",
    "description": "Dermal filler",
    "price": 0,
    "duration": 30
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "number",
                "code": "too_small",
                "minimum": 1,
                "inclusive": true,
                "path": ["price"],
                "message": "Price must be greater than 0"
            }
        ]
    }
}
```

---

## `GET /medspas/:medspaId/services`

### Request

| Location | Field      | Type | Required | Description |
| -------- | ---------- | ---- | -------- | ----------- |
| param    | `medspaId` | uuid | yes      | Medspa ID   |

**200** — Success

```sh
curl http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/services
```

```json
{
    "success": true,
    "data": [
        {
            "id": "4b3c4ed0-d9d1-476a-9b09-118f65b63398",
            "name": "Botox",
            "description": "Botox injection",
            "price": 30000,
            "duration": 30,
            "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
            "createdAt": "2026-03-02T05:10:30.294Z",
            "updatedAt": "2026-03-02T05:10:30.294Z",
            "deletedAt": null
        }
    ]
}
```

**404** — Medspa not found

```sh
curl http://localhost:3000/medspas/a0000001-0000-4000-8000-000000000001/services
```

```json
{
    "success": false,
    "error": {
        "message": "Medspa not found."
    }
}
```

**400** — Validation error

```sh
curl http://localhost:3000/medspas/not-a-uuid/services
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "string",
                "code": "invalid_format",
                "format": "uuid",
                "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
                "path": ["medspaId"],
                "message": "Invalid UUID"
            }
        ]
    }
}
```

---

## `POST /medspas/:medspaId/appointments`

### Request

| Location | Field        | Type              | Required | Description                                   |
| -------- | ------------ | ----------------- | -------- | --------------------------------------------- |
| param    | `medspaId`   | uuid              | yes      | Medspa ID                                     |
| body     | `startTime`  | ISO 8601 datetime | yes      | Must be in the future (millisecond precision) |
| body     | `serviceIds` | uuid[]            | yes      | 1–10 service IDs (no duplicates)              |

**201** — Created

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2027-06-15T10:00:00.000Z",
    "serviceIds": ["4b3c4ed0-d9d1-476a-9b09-118f65b63398"]
  }'
```

```json
{
    "success": true,
    "data": {
        "id": "3c093bd4-1730-49fa-abc8-1cf56a4c2448",
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "startTime": "2027-06-15T10:00:00.000Z",
        "status": "scheduled",
        "totalDuration": 30,
        "totalPrice": 30000,
        "scheduledAt": "2026-03-02T05:11:03.884Z",
        "completedAt": null,
        "canceledAt": null,
        "createdAt": "2026-03-02T05:11:03.884Z",
        "updatedAt": "2026-03-02T05:11:03.884Z",
        "deletedAt": null
    }
}
```

**404** — Medspa not found

```sh
curl -X POST http://localhost:3000/medspas/a0000001-0000-4000-8000-000000000001/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2027-06-15T10:00:00.000Z",
    "serviceIds": ["b0000002-0000-4000-9000-000000000002"]
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Medspa not found."
    }
}
```

**422** — One or more services not found

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2027-06-15T10:00:00.000Z",
    "serviceIds": ["b0000002-0000-4000-9000-000000000002"]
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "One or more services not found."
    }
}
```

**400** — Validation error

```sh
curl -X POST http://localhost:3000/medspas/02218056-2ad2-403e-9cd7-e4e8c1c72adc/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2020-01-01T00:00:00.000Z",
    "serviceIds": ["b0000002-0000-4000-9000-000000000002"]
  }'
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "code": "too_small",
                "origin": "date",
                "minimum": 1772428293713,
                "inclusive": false,
                "message": "startTime must be in the future",
                "path": ["startTime"]
            }
        ]
    }
}
```

---

## `GET /services/:serviceId`

### Request

| Location | Field       | Type | Required | Description |
| -------- | ----------- | ---- | -------- | ----------- |
| param    | `serviceId` | uuid | yes      | Service ID  |

**200** — Success

```sh
curl http://localhost:3000/services/4b3c4ed0-d9d1-476a-9b09-118f65b63398
```

```json
{
    "success": true,
    "data": {
        "id": "4b3c4ed0-d9d1-476a-9b09-118f65b63398",
        "name": "Botox",
        "description": "Botox injection",
        "price": 30000,
        "duration": 30,
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "createdAt": "2026-03-02T05:10:30.294Z",
        "updatedAt": "2026-03-02T05:10:30.294Z",
        "deletedAt": null
    }
}
```

**404** — Service not found

```sh
curl http://localhost:3000/services/b0000002-0000-4000-9000-000000000002
```

```json
{
    "success": false,
    "error": {
        "message": "Service not found."
    }
}
```

**400** — Validation error

```sh
curl http://localhost:3000/services/not-a-uuid
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "string",
                "code": "invalid_format",
                "format": "uuid",
                "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
                "path": ["serviceId"],
                "message": "Invalid UUID"
            }
        ]
    }
}
```

---

## `PATCH /services/:serviceId`

### Request

| Location | Field         | Type    | Required | Description                  |
| -------- | ------------- | ------- | -------- | ---------------------------- |
| param    | `serviceId`   | uuid    | yes      | Service ID                   |
| body     | `name`        | string  | no       | Service name                 |
| body     | `description` | string  | no       | Service description          |
| body     | `price`       | integer | no       | Price in cents (min: 1)      |
| body     | `duration`    | integer | no       | Duration in minutes (min: 1) |

At least one body field must be provided.

**200** — Updated

```sh
curl -X PATCH http://localhost:3000/services/4b3c4ed0-d9d1-476a-9b09-118f65b63398 \
  -H "Content-Type: application/json" \
  -d '{ "name": "Premium Botox" }'
```

```json
{
    "success": true,
    "data": {
        "id": "4b3c4ed0-d9d1-476a-9b09-118f65b63398",
        "name": "Premium Botox",
        "description": "Botox injection",
        "price": 30000,
        "duration": 30,
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "createdAt": "2026-03-02T05:10:30.294Z",
        "updatedAt": "2026-03-02T05:17:02.012Z",
        "deletedAt": null
    }
}
```

**404** — Service not found

```sh
curl -X PATCH http://localhost:3000/services/b0000002-0000-4000-9000-000000000002 \
  -H "Content-Type: application/json" \
  -d '{ "name": "Ghost" }'
```

```json
{
    "success": false,
    "error": {
        "message": "Service not found."
    }
}
```

**409** — Duplicate name within medspa

```sh
curl -X PATCH http://localhost:3000/services/4a1fc94c-757b-473e-b767-cfbbe6a4b0bd \
  -H "Content-Type: application/json" \
  -d '{ "name": "Premium Botox" }'
```

```json
{
    "success": false,
    "error": {
        "message": "Service already exists."
    }
}
```

**400** — Validation error

```sh
curl -X PATCH http://localhost:3000/services/4b3c4ed0-d9d1-476a-9b09-118f65b63398 \
  -H "Content-Type: application/json" \
  -d '{ "price": 0 }'
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "number",
                "code": "too_small",
                "minimum": 1,
                "inclusive": true,
                "path": ["price"],
                "message": "Price must be greater than 0"
            }
        ]
    }
}
```

---

## `GET /appointments`

**200** — Success

```sh
curl http://localhost:3000/appointments
```

```json
{
    "success": true,
    "data": [
        {
            "id": "3c093bd4-1730-49fa-abc8-1cf56a4c2448",
            "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
            "startTime": "2027-06-15T10:00:00.000Z",
            "status": "scheduled",
            "totalDuration": 30,
            "totalPrice": 30000,
            "scheduledAt": "2026-03-02T05:11:03.884Z",
            "completedAt": null,
            "canceledAt": null,
            "createdAt": "2026-03-02T05:11:03.884Z",
            "updatedAt": "2026-03-02T05:11:03.884Z",
            "deletedAt": null
        }
    ]
}
```

---

## `GET /appointments/:appointmentId`

### Request

| Location | Field           | Type | Required | Description    |
| -------- | --------------- | ---- | -------- | -------------- |
| param    | `appointmentId` | uuid | yes      | Appointment ID |

**200** — Success

```sh
curl http://localhost:3000/appointments/3c093bd4-1730-49fa-abc8-1cf56a4c2448
```

```json
{
    "success": true,
    "data": {
        "id": "3c093bd4-1730-49fa-abc8-1cf56a4c2448",
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "startTime": "2027-06-15T10:00:00.000Z",
        "status": "scheduled",
        "totalDuration": 30,
        "totalPrice": 30000,
        "scheduledAt": "2026-03-02T05:11:03.884Z",
        "completedAt": null,
        "canceledAt": null,
        "createdAt": "2026-03-02T05:11:03.884Z",
        "updatedAt": "2026-03-02T05:11:03.884Z",
        "deletedAt": null
    }
}
```

**404** — Appointment not found

```sh
curl http://localhost:3000/appointments/c0000003-0000-4000-a000-000000000003
```

```json
{
    "success": false,
    "error": {
        "message": "Appointment not found."
    }
}
```

**400** — Validation error

```sh
curl http://localhost:3000/appointments/not-a-uuid
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "origin": "string",
                "code": "invalid_format",
                "format": "uuid",
                "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
                "path": ["appointmentId"],
                "message": "Invalid UUID"
            }
        ]
    }
}
```

---

## `PATCH /appointments/:appointmentId`

### Request

| Location | Field           | Type   | Required | Description                   |
| -------- | --------------- | ------ | -------- | ----------------------------- |
| param    | `appointmentId` | uuid   | yes      | Appointment ID                |
| body     | `status`        | string | yes      | `"completed"` or `"canceled"` |

**200** — Updated

```sh
curl -X PATCH http://localhost:3000/appointments/3c093bd4-1730-49fa-abc8-1cf56a4c2448 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

```json
{
    "success": true,
    "data": {
        "id": "3c093bd4-1730-49fa-abc8-1cf56a4c2448",
        "medspaId": "02218056-2ad2-403e-9cd7-e4e8c1c72adc",
        "startTime": "2027-06-15T10:00:00.000Z",
        "status": "completed",
        "totalDuration": 30,
        "totalPrice": 30000,
        "scheduledAt": "2026-03-02T05:11:03.884Z",
        "completedAt": "2026-03-02T05:18:21.111Z",
        "canceledAt": null,
        "createdAt": "2026-03-02T05:11:03.884Z",
        "updatedAt": "2026-03-02T05:18:21.111Z",
        "deletedAt": null
    }
}
```

**404** — Appointment not found

```sh
curl -X PATCH http://localhost:3000/appointments/c0000003-0000-4000-a000-000000000003 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

```json
{
    "success": false,
    "error": {
        "message": "Appointment not found."
    }
}
```

**409** — Status conflict

```sh
curl -X PATCH http://localhost:3000/appointments/3c093bd4-1730-49fa-abc8-1cf56a4c2448 \
  -H "Content-Type: application/json" \
  -d '{ "status": "canceled" }'
```

```json
{
    "success": false,
    "error": {
        "message": "Only scheduled appointments can be updated."
    }
}
```

**400** — Validation error

```sh
curl -X PATCH http://localhost:3000/appointments/3c093bd4-1730-49fa-abc8-1cf56a4c2448 \
  -H "Content-Type: application/json" \
  -d '{ "status": "invalid" }'
```

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "issues": [
            {
                "code": "invalid_value",
                "values": ["completed", "canceled"],
                "path": ["status"],
                "message": "Invalid option: expected one of \"completed\"|\"canceled\""
            }
        ]
    }
}
```
