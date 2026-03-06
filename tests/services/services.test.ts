import { ServiceRepository } from '@/services/services.repository.ts';
import type { Service } from '@/services/services.schema.ts';
import { services } from '@/services/services.ts';

vi.mock('@/database/database.ts');

const serviceId = 'b0000002-0000-4000-9000-000000000002';
const medspaId = 'a0000001-0000-4000-8000-000000000001';

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

const findByIdSpy = vi.spyOn(ServiceRepository.prototype, 'findById');
const updateSpy = vi.spyOn(ServiceRepository.prototype, 'update');

afterEach(() => {
  vi.resetAllMocks();
});

describe('services routes', () => {
  describe('GET /:serviceId', () => {
    describe('returns 200 when', () => {
      test('service is found', async () => {
        findByIdSpy.mockResolvedValueOnce({
          status: 'found',
          data: serviceData,
        });

        const response = await services.request(`/${serviceId}`);

        expect(response.status).toStrictEqual(200);
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

    describe('returns 404 when', () => {
      test('service is not found', async () => {
        findByIdSpy.mockResolvedValueOnce({ status: 'not_found' });

        const response = await services.request(`/${serviceId}`);

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Service not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 400 when', () => {
      test('`serviceId` param is invalid', async () => {
        const response = await services.request('/not-a-uuid');

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
                    "serviceId",
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

  describe('PATCH /:serviceId', () => {
    function jsonPatch(path: string, body: unknown) {
      return services.request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    describe('returns 200 when', () => {
      test('service is updated', async () => {
        updateSpy.mockResolvedValueOnce({
          status: 'updated',
          data: { ...serviceData, name: 'Updated' },
        });

        const response = await jsonPatch(`/${serviceId}`, { name: 'Updated' });

        expect(response.status).toStrictEqual(200);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "data": {
              "createdAt": "2025-01-01T00:00:00.000Z",
              "deletedAt": null,
              "description": "Botox injection",
              "duration": 30,
              "id": "b0000002-0000-4000-9000-000000000002",
              "medspaId": "a0000001-0000-4000-8000-000000000001",
              "name": "Updated",
              "price": 30000,
              "updatedAt": "2025-01-01T00:00:00.000Z",
            },
            "success": true,
          }
        `);
      });
    });

    describe('returns 404 when', () => {
      test('service is not found', async () => {
        updateSpy.mockResolvedValueOnce({ status: 'not_found' });

        const response = await jsonPatch(`/${serviceId}`, { name: 'Ghost' });

        expect(response.status).toStrictEqual(404);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "message": "Service not found.",
            },
            "success": false,
          }
        `);
      });
    });

    describe('returns 409 when', () => {
      test('service name already exists', async () => {
        updateSpy.mockResolvedValueOnce({
          status: 'duplicate',
          constraint: 'medspa_id_name',
        });

        const response = await jsonPatch(`/${serviceId}`, {
          name: 'Duplicate',
        });

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

    describe('returns 400 when', () => {
      test('text fields are empty', async () => {
        const response = await jsonPatch(`/${serviceId}`, {
          name: '',
          description: '  ',
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
        const response = await jsonPatch(`/${serviceId}`, {
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

      test('body is empty', async () => {
        const response = await jsonPatch(`/${serviceId}`, {});

        expect(response.status).toStrictEqual(400);
        expect(await response.json()).toMatchInlineSnapshot(`
          {
            "error": {
              "issues": [
                {
                  "code": "custom",
                  "message": "At least one field must be provided",
                  "path": [],
                },
              ],
              "message": "Validation failed",
            },
            "success": false,
          }
        `);
      });

      test('`serviceId` param is invalid', async () => {
        const response = await jsonPatch('/not-a-uuid', { name: 'Test' });

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
                    "serviceId",
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
