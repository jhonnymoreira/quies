# API Overview

## `POST /medspas`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 201    | success | `{ success: true, data: Medspa }`                                            |
| 409    | error   | `{ success: false, error: { message: "Medspa already exists." } }`           |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `POST /medspas/:medspaId/services`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 201    | success | `{ success: true, data: Service }`                                           |
| 409    | error   | `{ success: false, error: { message: "Service already exists." } }`          |
| 404    | error   | `{ success: false, error: { message: "Medspa not found." } }`                |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `GET /medspas/:medspaId/services`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 200    | success | `{ success: true, data: Service[] }`                                         |
| 404    | error   | `{ success: false, error: { message: "Medspa not found." } }`                |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `POST /medspas/:medspaId/appointments`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 201    | success | `{ success: true, data: Appointment }`                                       |
| 404    | error   | `{ success: false, error: { message: "Medspa not found." } }`                |
| 422    | error   | `{ success: false, error: { message: "One or more services not found." } }`  |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `GET /services/:serviceId`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 200    | success | `{ success: true, data: Service }`                                           |
| 404    | error   | `{ success: false, error: { message: "Service not found." } }`               |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `PATCH /services/:serviceId`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 200    | success | `{ success: true, data: Service }`                                           |
| 404    | error   | `{ success: false, error: { message: "Service not found." } }`               |
| 409    | error   | `{ success: false, error: { message: "Service already exists." } }`          |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `GET /appointments`

| Status | Type    | Body                                     |
| ------ | ------- | ---------------------------------------- |
| 200    | success | `{ success: true, data: Appointment[] }` |

## `GET /appointments/:appointmentId`

| Status | Type    | Body                                                                         |
| ------ | ------- | ---------------------------------------------------------------------------- |
| 200    | success | `{ success: true, data: Appointment }`                                       |
| 404    | error   | `{ success: false, error: { message: "Appointment not found." } }`           |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }` |

## `PATCH /appointments/:appointmentId`

| Status | Type    | Body                                                                                    |
| ------ | ------- | --------------------------------------------------------------------------------------- |
| 200    | success | `{ success: true, data: Appointment }`                                                  |
| 404    | error   | `{ success: false, error: { message: "Appointment not found." } }`                      |
| 409    | error   | `{ success: false, error: { message: "Only scheduled appointments can be updated." } }` |
| 400    | error   | `{ success: false, error: { message: "Validation failed", issues: [...] } }`            |
