import { factory } from '@/app/factory.ts';
import { requestValidation } from '@/app/middlewares/request-validation.ts';
import { ErrorResponse } from '@/app/responses/error-response.ts';
import { SuccessResponse } from '@/app/responses/success-response.ts';
import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import { appointmentInsertSchema } from '@/appointments/appointments.schema.ts';
import { database } from '@/database/database.ts';
import { ServiceRepository } from '@/services/services.repository.ts';
import { serviceInsertSchema } from '@/services/services.schema.ts';
import { MedspaRepository } from './medspas.repository.ts';
import { medspaIdSchema, medspaInsertSchema } from './medspas.schema.ts';

const medspaRepository = new MedspaRepository(database);
const appointmentRepository = new AppointmentRepository(database);
const serviceRepository = new ServiceRepository(database);

export const medspas = factory
  .createApp()
  .post('/', requestValidation('json', medspaInsertSchema), async (context) => {
    const data = context.req.valid('json');
    const result = await medspaRepository.insert(data);

    switch (result.status) {
      case 'created':
        return context.json(new SuccessResponse(result.data), 201);
      case 'duplicate':
        return context.json(new ErrorResponse('Medspa already exists.'), 409);
    }
  })
  .post(
    '/:medspaId/appointments',
    requestValidation('param', medspaIdSchema),
    requestValidation('json', appointmentInsertSchema.omit({ medspaId: true })),
    async (context) => {
      const { medspaId } = context.req.valid('param');
      const data = {
        medspaId,
        ...context.req.valid('json'),
      };

      const result = await appointmentRepository.insert(data);

      switch (result.status) {
        case 'created':
          return context.json(new SuccessResponse(result.data), 201);
        case 'reference_not_found': {
          if (result.field === 'medspaId') {
            return context.json(new ErrorResponse('Medspa not found.'), 404);
          }

          return context.json(
            new ErrorResponse('One or more services not found.'),
            422
          );
        }
      }
    }
  )
  .get(
    '/:medspaId/services',
    requestValidation('param', medspaIdSchema),
    async (context) => {
      const { medspaId } = context.req.valid('param');
      const result = await serviceRepository.findAllByMedspaId(medspaId);

      switch (result.status) {
        case 'found':
          return context.json(new SuccessResponse(result.data), 200);
        case 'reference_not_found':
          return context.json(new ErrorResponse('Medspa not found.'), 404);
      }
    }
  )
  .post(
    '/:medspaId/services',
    requestValidation('param', medspaIdSchema),
    requestValidation('json', serviceInsertSchema.omit({ medspaId: true })),
    async (context) => {
      const { medspaId } = context.req.valid('param');
      const data = {
        medspaId,
        ...context.req.valid('json'),
      };

      const result = await serviceRepository.insert(data);

      switch (result.status) {
        case 'created':
          return context.json(new SuccessResponse(result.data), 201);
        case 'duplicate':
          return context.json(
            new ErrorResponse('Service already exists.'),
            409
          );
        case 'reference_not_found':
          return context.json(new ErrorResponse('Medspa not found.'), 404);
      }
    }
  );
