import { factory } from '@/app/factory.ts';
import { requestValidation } from '@/app/middlewares/request-validation.ts';
import { ErrorResponse } from '@/app/responses/error-response.ts';
import { SuccessResponse } from '@/app/responses/success-response.ts';
import { database } from '@/database/database.ts';
import { ServiceRepository } from './services.repository.ts';
import { serviceIdSchema, serviceUpdateSchema } from './services.schema.ts';

const serviceRepository = new ServiceRepository(database);

export const services = factory
  .createApp()
  .get(
    '/:serviceId',
    requestValidation('param', serviceIdSchema),
    async (context) => {
      const { serviceId } = context.req.valid('param');
      const result = await serviceRepository.findById(serviceId);

      switch (result.status) {
        case 'found':
          return context.json(new SuccessResponse(result.data), 200);
        case 'not_found':
          return context.json(new ErrorResponse('Service not found.'), 404);
      }
    }
  )
  .patch(
    '/:serviceId',
    requestValidation('param', serviceIdSchema),
    requestValidation('json', serviceUpdateSchema),
    async (context) => {
      const { serviceId } = context.req.valid('param');
      const data = context.req.valid('json');
      const result = await serviceRepository.update(serviceId, data);

      switch (result.status) {
        case 'updated':
          return context.json(new SuccessResponse(result.data), 200);
        case 'not_found':
          return context.json(new ErrorResponse('Service not found.'), 404);
        case 'duplicate':
          return context.json(
            new ErrorResponse('Service already exists.'),
            409
          );
      }
    }
  );
