import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import type { Appointment } from '@/appointments/appointments.schema.ts';
import { appointments } from '@/appointments/appointments.ts';

vi.mock('@/database/database.ts');

const appointmentId = 'c0000003-0000-4000-a000-000000000003';

const appointmentData: Appointment = {
  id: appointmentId,
  medspaId: 'a0000001-0000-4000-8000-000000000001',
  startTime: new Date('2027-01-01'),
  status: 'scheduled',
  totalPrice: 30000,
  totalDuration: 30,
  scheduledAt: new Date('2025-01-01'),
  completedAt: null,
  canceledAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

const findAllSpy = vi.spyOn(AppointmentRepository.prototype, 'findAll');
const findByIdSpy = vi.spyOn(AppointmentRepository.prototype, 'findById');
const updateSpy = vi.spyOn(AppointmentRepository.prototype, 'update');

afterEach(() => {
  vi.resetAllMocks();
});

describe('appointments routes', () => {
  describe('GET /', () => {
    describe('returns 200 when', () => {
      test('appointments are listed', async () => {
        findAllSpy.mockResolvedValueOnce({
          status: 'found',
          data: [appointmentData],
        });

        const response = await appointments.request('/');

        expect(response.status).toStrictEqual(200);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": [
              {
                "canceledAt": null,
                "completedAt": null,
                "createdAt": "2025-01-01T00:00:00.000Z",
                "deletedAt": null,
                "id": "c0000003-0000-4000-a000-000000000003",
                "medspaId": "a0000001-0000-4000-8000-000000000001",
                "scheduledAt": "2025-01-01T00:00:00.000Z",
                "startTime": "2027-01-01T00:00:00.000Z",
                "status": "scheduled",
                "totalDuration": 30,
                "totalPrice": 30000,
                "updatedAt": "2025-01-01T00:00:00.000Z",
              },
            ],
            "success": true,
          }
        `);
      });
    });
  });

  describe('GET /:appointmentId', () => {
    describe('returns 200 when', () => {
      test('appointment is found', async () => {
        findByIdSpy.mockResolvedValueOnce({
          status: 'found',
          data: appointmentData,
        });

        const response = await appointments.request(`/${appointmentId}`);

        expect(response.status).toStrictEqual(200);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": {
              "canceledAt": null,
              "completedAt": null,
              "createdAt": "2025-01-01T00:00:00.000Z",
              "deletedAt": null,
              "id": "c0000003-0000-4000-a000-000000000003",
              "medspaId": "a0000001-0000-4000-8000-000000000001",
              "scheduledAt": "2025-01-01T00:00:00.000Z",
              "startTime": "2027-01-01T00:00:00.000Z",
              "status": "scheduled",
              "totalDuration": 30,
              "totalPrice": 30000,
              "updatedAt": "2025-01-01T00:00:00.000Z",
            },
            "success": true,
          }
        `);
      });
    });

    describe('returns 404 when', () => {
      test('appointment is not found', async () => {
        findByIdSpy.mockResolvedValueOnce({ status: 'not_found' });

        const response = await appointments.request(`/${appointmentId}`);

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Appointment not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('`appointmentId` param is invalid', async () => {
        const response = await appointments.request('/not-a-uuid');

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_format",
                  "format": "uuid",
                  "message": "Invalid UUID",
                  "origin": "string",
                  "path": [
                    "appointmentId",
                  ],
                  "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });
    });
  });

  describe('PATCH /:appointmentId', () => {
    function jsonPatch(path: string, body: unknown) {
      return appointments.request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    describe('returns 200 when', () => {
      test('appointment is updated', async () => {
        updateSpy.mockResolvedValueOnce({
          status: 'updated',
          data: {
            ...appointmentData,
            status: 'completed',
            completedAt: new Date('2025-06-01'),
            updatedAt: new Date('2025-06-01'),
          },
        });

        const response = await jsonPatch(`/${appointmentId}`, {
          status: 'completed',
        });

        expect(response.status).toStrictEqual(200);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": {
              "canceledAt": null,
              "completedAt": "2025-06-01T00:00:00.000Z",
              "createdAt": "2025-01-01T00:00:00.000Z",
              "deletedAt": null,
              "id": "c0000003-0000-4000-a000-000000000003",
              "medspaId": "a0000001-0000-4000-8000-000000000001",
              "scheduledAt": "2025-01-01T00:00:00.000Z",
              "startTime": "2027-01-01T00:00:00.000Z",
              "status": "completed",
              "totalDuration": 30,
              "totalPrice": 30000,
              "updatedAt": "2025-06-01T00:00:00.000Z",
            },
            "success": true,
          }
        `);
      });
    });

    describe('returns 404 when', () => {
      test('appointment is not found', async () => {
        updateSpy.mockResolvedValueOnce({ status: 'not_found' });

        const response = await jsonPatch(`/${appointmentId}`, {
          status: 'completed',
        });

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Appointment not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 409 when', () => {
      test('appointment has a status conflict', async () => {
        updateSpy.mockResolvedValueOnce({
          status: 'status_conflict',
          currentStatus: 'completed',
        });

        const response = await jsonPatch(`/${appointmentId}`, {
          status: 'canceled',
        });

        expect(response.status).toStrictEqual(409);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Only scheduled appointments can be updated.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('`status` is invalid', async () => {
        const response = await jsonPatch(`/${appointmentId}`, {
          status: 'invalid',
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_value",
                  "message": "Invalid option: expected one of "completed"|"canceled"",
                  "path": [
                    "status",
                  ],
                  "values": [
                    "completed",
                    "canceled",
                  ],
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`appointmentId` param is invalid', async () => {
        const response = await jsonPatch('/not-a-uuid', {
          status: 'completed',
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_format",
                  "format": "uuid",
                  "message": "Invalid UUID",
                  "origin": "string",
                  "path": [
                    "appointmentId",
                  ],
                  "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });
    });
  });
});
