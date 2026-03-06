import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core';
import { appointments } from '@/appointments/appointments.schema.ts';
import { services } from '@/services/services.schema.ts';

export const appointmentServices = pgTable(
  'appointments_services',
  {
    appointmentId: uuid().notNull(),
    serviceId: uuid().notNull(),
    medspaId: uuid().notNull(),
    price: integer().notNull(),
    duration: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appointmentId, table.serviceId] }),
    foreignKey({
      columns: [table.appointmentId, table.medspaId],
      foreignColumns: [appointments.id, appointments.medspaId],
      name: 'appointments_services_appointment_fk',
    }),
    foreignKey({
      columns: [table.serviceId, table.medspaId],
      foreignColumns: [services.id, services.medspaId],
      name: 'appointments_services_service_fk',
    }),
    check('appointments_services_price_positive', sql`${table.price} > 0`),
    check(
      'appointments_services_duration_positive',
      sql`${table.duration} > 0`
    ),
  ]
);
