import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps } from '@/database/timestamps.ts';
import { medspas } from '@/medspas/medspas.schema.ts';
import { serviceSelectSchema } from '@/services/services.schema.ts';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'completed',
  'canceled',
]);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid().defaultRandom().primaryKey(),
    medspaId: uuid()
      .notNull()
      .references(() => medspas.id),
    startTime: timestamp({
      mode: 'date',
      withTimezone: true,
      precision: 3,
    }).notNull(),
    status: appointmentStatusEnum().notNull().default('scheduled'),
    totalDuration: integer().notNull(),
    totalPrice: integer().notNull(),
    scheduledAt: timestamp({
      mode: 'date',
      withTimezone: true,
      precision: 3,
    })
      .notNull()
      .defaultNow(),
    completedAt: timestamp({
      mode: 'date',
      withTimezone: true,
      precision: 3,
    }),
    canceledAt: timestamp({
      mode: 'date',
      withTimezone: true,
      precision: 3,
    }),
    ...timestamps,
  },
  (table) => [
    unique('appointments_id_medspa_id_unique').on(table.id, table.medspaId),
    check(
      'appointments_total_duration_positive',
      sql`${table.totalDuration} > 0`
    ),
    check('appointments_total_price_positive', sql`${table.totalPrice} > 0`),
    check(
      'appointments_status_scheduled_consistency',
      sql`${table.status} != 'scheduled' OR (${table.scheduledAt} IS NOT NULL AND ${table.completedAt} IS NULL AND ${table.canceledAt} IS NULL)`
    ),
    check(
      'appointments_status_completed_consistency',
      sql`${table.status} != 'completed' OR (${table.scheduledAt} IS NOT NULL AND ${table.completedAt} IS NOT NULL AND ${table.canceledAt} IS NULL)`
    ),
    check(
      'appointments_status_canceled_consistency',
      sql`${table.status} != 'canceled' OR (${table.scheduledAt} IS NOT NULL AND ${table.completedAt} IS NULL AND ${table.canceledAt} IS NOT NULL)`
    ),
  ]
);

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  zodInstance: z,
});

const appointmentSelectSchema = createSelectSchema(appointments);
export const appointmentIdSchema = z.object({
  appointmentId: appointmentSelectSchema.shape.id,
});

export const appointmentInsertSchema = createInsertSchema(appointments, {
  startTime: z.iso
    .datetime({ precision: 3 })
    .superRefine((value, context) => {
      if (new Date(value) < new Date()) {
        context.addIssue({
          code: 'too_small',
          origin: 'date',
          minimum: Number(new Date()),
          inclusive: false,
          input: value,
          message: 'startTime must be in the future',
        });
      }
    })
    .transform((value) => new Date(value)),
})
  .pick({
    medspaId: true,
    startTime: true,
  })
  .extend({
    serviceIds: z
      .array(serviceSelectSchema.shape.id)
      .min(1, 'At least one service is required')
      .max(10, 'Cannot exceed 10 services per appointment')
      .superRefine((serviceIds, context) => {
        const seen = new Set<string>();
        const duplicates = new Set<string>();

        for (const serviceId of serviceIds) {
          if (seen.has(serviceId)) {
            duplicates.add(serviceId);
          }
          seen.add(serviceId);
        }

        if (duplicates.size > 0) {
          context.addIssue({
            code: 'invalid_value',
            message: 'Duplicate serviceIds are not allowed',
            input: serviceIds,
            continue: false,
            values: Array.from(duplicates),
          });
        }
      }),
  });

export const appointmentUpdateSchema = z.object({
  status: z.enum(['completed', 'canceled']),
});

export type Appointment = typeof appointments.$inferSelect;
export type AppointmentInsertSchema = z.infer<typeof appointmentInsertSchema>;
export type AppointmentUpdateSchema = z.infer<typeof appointmentUpdateSchema>;
