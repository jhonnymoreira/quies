import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { appointmentServices } from '@/appointments-services/appointments-services.schema.ts';
import { Repository } from '@/database/repository.ts';
import type {
  Created,
  Found,
  NotFound,
  ReferenceNotFound,
  StatusConflict,
  Updated,
} from '@/database/result-types.ts';
import { medspas } from '@/medspas/medspas.schema.ts';
import { services } from '@/services/services.schema.ts';
import {
  type Appointment,
  type AppointmentInsertSchema,
  type AppointmentUpdateSchema,
  appointments,
} from './appointments.schema.ts';

const AppointmentStatusTimestampColumn = {
  COMPLETED: 'completedAt',
  CANCELED: 'canceledAt',
} as const;

type AppointmentInsertResult =
  | Created<Appointment>
  | ReferenceNotFound<'medspaId'>
  | (ReferenceNotFound<'serviceIds'> & { missingIds: string[] });

type AppointmentUpdateResult =
  | Updated<Appointment>
  | NotFound
  | StatusConflict<'completed' | 'canceled'>;

type AppointmentFindByIdResult = Found<Appointment> | NotFound;

export class AppointmentRepository extends Repository {
  async insert(
    data: AppointmentInsertSchema
  ): Promise<AppointmentInsertResult> {
    return this.execute(() =>
      this.database.transaction(async (transaction) => {
        const rows = await transaction
          .select({
            medspaId: medspas.id,
            serviceId: services.id,
            price: services.price,
            duration: services.duration,
          })
          .from(medspas)
          .leftJoin(
            services,
            and(
              eq(services.medspaId, medspas.id),
              inArray(services.id, data.serviceIds),
              isNull(services.deletedAt)
            )
          )
          .where(and(eq(medspas.id, data.medspaId), isNull(medspas.deletedAt)));

        if (rows.length === 0) {
          return {
            status: 'reference_not_found',
            field: 'medspaId',
          };
        }

        const serviceRows = rows.filter(
          (
            row
          ): row is typeof row & {
            serviceId: string;
            price: number;
            duration: number;
          } => row.serviceId !== null
        );

        const idsFound = new Set(serviceRows.map((row) => row.serviceId));
        const missingIds = data.serviceIds.filter((id) => !idsFound.has(id));

        if (missingIds.length > 0) {
          return {
            status: 'reference_not_found',
            field: 'serviceIds',
            missingIds,
          };
        }

        const totalPrice = serviceRows.reduce(
          (sum, service) => sum + service.price,
          0
        );
        const totalDuration = serviceRows.reduce(
          (sum, service) => sum + service.duration,
          0
        );

        return transaction.transaction(async (savepoint) => {
          const [appointment] = await savepoint
            .insert(appointments)
            .values({
              medspaId: data.medspaId,
              startTime: data.startTime,
              totalPrice,
              totalDuration,
            })
            .returning();

          if (!appointment) {
            throw new Error('Unable to create appointment.');
          }

          await savepoint.insert(appointmentServices).values(
            serviceRows.map((service) => ({
              appointmentId: appointment.id,
              serviceId: service.serviceId,
              medspaId: data.medspaId,
              price: service.price,
              duration: service.duration,
            }))
          );

          return { status: 'created', data: appointment };
        });
      })
    );
  }

  async update(
    appointmentId: Appointment['id'],
    data: AppointmentUpdateSchema
  ): Promise<AppointmentUpdateResult> {
    return this.execute(() =>
      this.database.transaction(async (transaction) => {
        const [existing] = await transaction
          .select({ status: appointments.status })
          .from(appointments)
          .where(
            and(
              eq(appointments.id, appointmentId),
              isNull(appointments.deletedAt)
            )
          )
          .for('update');

        if (!existing) {
          return { status: 'not_found' };
        }

        if (existing.status !== 'scheduled') {
          return {
            status: 'status_conflict',
            currentStatus: existing.status,
          };
        }

        const timestampColumn =
          AppointmentStatusTimestampColumn[
            data.status.toUpperCase() as keyof typeof AppointmentStatusTimestampColumn
          ];

        const [row] = await transaction
          .update(appointments)
          .set({
            status: data.status,
            [timestampColumn]: new Date(),
          })
          .where(eq(appointments.id, appointmentId))
          .returning();

        if (!row) {
          throw new Error('Update returned no rows');
        }

        return { status: 'updated', data: row };
      })
    );
  }

  async findAll(): Promise<Found<Appointment[]>> {
    const data = await this.execute(() =>
      this.database
        .select()
        .from(appointments)
        .where(isNull(appointments.deletedAt))
        .orderBy(desc(appointments.createdAt))
    );

    return { status: 'found', data };
  }

  async findById(
    appointmentId: Appointment['id']
  ): Promise<AppointmentFindByIdResult> {
    const [row] = await this.execute(() =>
      this.database
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, appointmentId),
            isNull(appointments.deletedAt)
          )
        )
    );

    if (!row) {
      return { status: 'not_found' };
    }

    return { status: 'found', data: row };
  }
}
