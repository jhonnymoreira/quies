import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import type { Appointment } from '@/appointments/appointments.schema.ts';
import { MedspaRepository } from '@/medspas/medspas.repository.ts';
import type { Medspa } from '@/medspas/medspas.schema.ts';
import { medspas } from '@/medspas/medspas.ts';
import { ServiceRepository } from '@/services/services.repository.ts';
import type { Service } from '@/services/services.schema.ts';

vi.mock('@/database/database.ts');

const medspaId = 'a0000001-0000-4000-8000-000000000001';
const serviceId = 'b0000002-0000-4000-9000-000000000002';

const medspaData: Medspa = {
  id: medspaId,
  name: 'Test Spa',
  address: '123 Main St',
  phoneNumber: '+12125551234',
  email: 'test@spa.com',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

const serviceData: Service = {
  id: serviceId,
  name: 'Botox',
  description: 'Botox injection',
  price: 30000,
  duration: 30,
  medspaId,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

const appointmentData: Appointment = {
  id: 'c0000003-0000-4000-a000-000000000003',
  medspaId,
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

const insertMedspaSpy = vi.spyOn(MedspaRepository.prototype, 'insert');
const insertAppointmentSpy = vi.spyOn(
  AppointmentRepository.prototype,
  'insert'
);
const findAllByMedspaIdSpy = vi.spyOn(
  ServiceRepository.prototype,
  'findAllByMedspaId'
);
const insertServiceSpy = vi.spyOn(ServiceRepository.prototype, 'insert');

afterEach(() => {
  vi.resetAllMocks();
});

function jsonPost(path: string, body: unknown) {
  return medspas.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('medspas routes', () => {
  describe('POST /', () => {
    const validBody = {
      name: 'Test Spa',
      address: '123 Main St',
      phoneNumber: '+12125551234',
      email: 'test@spa.com',
    };

    describe('returns 201 when', () => {
      test('medspa is created', async () => {
        insertMedspaSpy.mockResolvedValueOnce({
          status: 'created',
          data: medspaData,
        });

        const response = await jsonPost('/', validBody);

        expect(response.status).toStrictEqual(201);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": {
              "address": "123 Main St",
              "createdAt": "2025-01-01T00:00:00.000Z",
              "deletedAt": null,
              "email": "test@spa.com",
              "id": "a0000001-0000-4000-8000-000000000001",
              "name": "Test Spa",
              "phoneNumber": "+12125551234",
              "updatedAt": "2025-01-01T00:00:00.000Z",
            },
            "success": true,
          }
        `);
      });
    });

    describe('returns 409 when', () => {
      test('medspa `address` is duplicate', async () => {
        insertMedspaSpy.mockResolvedValueOnce({
          status: 'duplicate',
          constraint: 'address',
        });

        const response = await jsonPost('/', validBody);

        expect(response.status).toStrictEqual(409);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Medspa already exists.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('text fields are empty', async () => {
        const response = await jsonPost('/', {
          name: '',
          address: '  ',
          phoneNumber: '',
          email: 'test@spa.com',
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Name must not be empty",
                  "minimum": 1,
                  "origin": "string",
                  "path": [
                    "name",
                  ],
                },
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Address must not be empty",
                  "minimum": 1,
                  "origin": "string",
                  "path": [
                    "address",
                  ],
                },
                {
                  "code": "invalid_format",
                  "format": "regex",
                  "message": "Phone number must be in E.164 format (e.g. +12125551234)",
                  "origin": "string",
                  "path": [
                    "phoneNumber",
                  ],
                  "pattern": "/^\\+[1-9]\\d{1,14}$/",
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`email` is invalid', async () => {
        const response = await jsonPost('/', {
          ...validBody,
          email: 'not-an-email',
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_format",
                  "format": "email",
                  "message": "Invalid email address",
                  "origin": "string",
                  "path": [
                    "email",
                  ],
                  "pattern": "/^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$/",
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`phoneNumber` is not in E.164 format', async () => {
        const response = await jsonPost('/', {
          ...validBody,
          phoneNumber: '212-555-1234',
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_format",
                  "format": "regex",
                  "message": "Phone number must be in E.164 format (e.g. +12125551234)",
                  "origin": "string",
                  "path": [
                    "phoneNumber",
                  ],
                  "pattern": "/^\\+[1-9]\\d{1,14}$/",
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

  describe('POST /:medspaId/appointments', () => {
    const validBody = {
      startTime: '2027-06-15T10:00:00.000Z',
      serviceIds: [serviceId],
    };

    describe('returns 201 when', () => {
      test('appointment is created', async () => {
        insertAppointmentSpy.mockResolvedValueOnce({
          status: 'created',
          data: appointmentData,
        });

        const response = await jsonPost(`/${medspaId}/appointments`, validBody);

        expect(response.status).toStrictEqual(201);
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
      test('`medspaId` is not found', async () => {
        insertAppointmentSpy.mockResolvedValueOnce({
          status: 'reference_not_found',
          field: 'medspaId',
        });

        const response = await jsonPost(`/${medspaId}/appointments`, validBody);

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Medspa not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 422 when', () => {
      test('`serviceIds` are not found', async () => {
        insertAppointmentSpy.mockResolvedValueOnce({
          status: 'reference_not_found',
          field: 'serviceIds',
          missingIds: [serviceId],
        });

        const response = await jsonPost(`/${medspaId}/appointments`, validBody);

        expect(response.status).toStrictEqual(422);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "One or more services not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('`startTime` is in the past', async () => {
        const response = await jsonPost(`/${medspaId}/appointments`, {
          startTime: '2020-01-01T00:00:00.000Z',
          serviceIds: [serviceId],
        });

        expect(response.status).toStrictEqual(400);
      });

      test('`serviceIds` has duplicates', async () => {
        const response = await jsonPost(`/${medspaId}/appointments`, {
          startTime: '2027-06-15T10:00:00.000Z',
          serviceIds: [serviceId, serviceId],
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "invalid_value",
                  "message": "Duplicate serviceIds are not allowed",
                  "path": [
                    "serviceIds",
                  ],
                  "values": [
                    "b0000002-0000-4000-9000-000000000002",
                  ],
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`medspaId` param is invalid', async () => {
        const response = await jsonPost('/not-a-uuid/appointments', validBody);

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
                    "medspaId",
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

  describe('GET /:medspaId/services', () => {
    describe('returns 200 when', () => {
      test('services are found', async () => {
        findAllByMedspaIdSpy.mockResolvedValueOnce({
          status: 'found',
          data: [serviceData],
        });

        const response = await medspas.request(`/${medspaId}/services`);

        expect(response.status).toStrictEqual(200);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": [
              {
                "createdAt": "2025-01-01T00:00:00.000Z",
                "deletedAt": null,
                "description": "Botox injection",
                "duration": 30,
                "id": "b0000002-0000-4000-9000-000000000002",
                "medspaId": "a0000001-0000-4000-8000-000000000001",
                "name": "Botox",
                "price": 30000,
                "updatedAt": "2025-01-01T00:00:00.000Z",
              },
            ],
            "success": true,
          }
        `);
      });
    });

    describe('returns 404 when', () => {
      test('`medspaId` is not found', async () => {
        findAllByMedspaIdSpy.mockResolvedValueOnce({
          status: 'reference_not_found',
          field: 'medspaId',
        });

        const response = await medspas.request(`/${medspaId}/services`);

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Medspa not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('`medspaId` param is invalid', async () => {
        const response = await medspas.request('/not-a-uuid/services');

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
                    "medspaId",
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

  describe('POST /:medspaId/services', () => {
    const validBody = {
      name: 'Botox',
      description: 'Botox injection',
      price: 30000,
      duration: 30,
    };

    describe('returns 201 when', () => {
      test('service is created', async () => {
        insertServiceSpy.mockResolvedValueOnce({
          status: 'created',
          data: serviceData,
        });

        const response = await jsonPost(`/${medspaId}/services`, validBody);

        expect(response.status).toStrictEqual(201);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": {
              "createdAt": "2025-01-01T00:00:00.000Z",
              "deletedAt": null,
              "description": "Botox injection",
              "duration": 30,
              "id": "b0000002-0000-4000-9000-000000000002",
              "medspaId": "a0000001-0000-4000-8000-000000000001",
              "name": "Botox",
              "price": 30000,
              "updatedAt": "2025-01-01T00:00:00.000Z",
            },
            "success": true,
          }
        `);
      });
    });

    describe('returns 409 when', () => {
      test('service name already exists', async () => {
        insertServiceSpy.mockResolvedValueOnce({
          status: 'duplicate',
          constraint: 'medspa_id_name',
        });

        const response = await jsonPost(`/${medspaId}/services`, validBody);

        expect(response.status).toStrictEqual(409);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Service already exists.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 404 when', () => {
      test('`medspaId` is not found', async () => {
        insertServiceSpy.mockResolvedValueOnce({
          status: 'reference_not_found',
          field: 'medspaId',
        });

        const response = await jsonPost(`/${medspaId}/services`, validBody);

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Medspa not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('text fields are empty', async () => {
        const response = await jsonPost(`/${medspaId}/services`, {
          name: '',
          description: '  ',
          price: 30000,
          duration: 30,
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Name must not be empty",
                  "minimum": 1,
                  "origin": "string",
                  "path": [
                    "name",
                  ],
                },
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Description must not be empty",
                  "minimum": 1,
                  "origin": "string",
                  "path": [
                    "description",
                  ],
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('body has invalid values', async () => {
        const response = await jsonPost(`/${medspaId}/services`, {
          name: 'Botox',
          description: 'Botox injection',
          price: 0,
          duration: 0,
        });

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Price must be greater than 0",
                  "minimum": 1,
                  "origin": "number",
                  "path": [
                    "price",
                  ],
                },
                {
                  "code": "too_small",
                  "inclusive": true,
                  "message": "Duration must be greater than 0",
                  "minimum": 1,
                  "origin": "number",
                  "path": [
                    "duration",
                  ],
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`medspaId` param is invalid', async () => {
        const response = await jsonPost('/not-a-uuid/services', validBody);

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
                    "medspaId",
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
