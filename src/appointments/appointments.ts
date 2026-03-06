import { factory } from '@/app/factory.ts';
import { requestValidation } from '@/app/middlewares/request-validation.ts';
import { ErrorResponse } from '@/app/responses/error-response.ts';
import { SuccessResponse } from '@/app/responses/success-response.ts';
import { database } from '@/database/database.ts';
import { AppointmentRepository } from './appointments.repository.ts';
import {
  appointmentIdSchema,
  appointmentUpdateSchema,
} from './appointments.schema.ts';

const appointmentRepository = new AppointmentRepository(database);

export const appointments = factory
  .createApp()
  .get('/', async (context) => {
    const result = await appointmentRepository.findAll();
    return context.json(new SuccessResponse(result.data), 200);
  })
  .get(
    '/:appointmentId',
    requestValidation('param', appointmentIdSchema),
    async (context) => {
      const { appointmentId } = context.req.valid('param');
      const result = await appointmentRepository.findById(appointmentId);

      switch (result.status) {
        case 'found':
          return context.json(new SuccessResponse(result.data), 200);
        case 'not_found':
          return context.json(new ErrorResponse('Appointment not found.'), 404);
      }
    }
  )
  .patch(
    '/:appointmentId',
    requestValidation('param', appointmentIdSchema),
    requestValidation('json', appointmentUpdateSchema),
    async (context) => {
      const { appointmentId } = context.req.valid('param');
      const data = context.req.valid('json');
      const result = await appointmentRepository.update(appointmentId, data);

      switch (result.status) {
        case 'updated':
          return context.json(new SuccessResponse(result.data), 200);
        case 'not_found':
          return context.json(new ErrorResponse('Appointment not found.'), 404);
        case 'status_conflict':
          return context.json(
            new ErrorResponse('Only scheduled appointments can be updated.'),
            409
          );
      }
    }
  );
