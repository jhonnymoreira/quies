import {
  integer,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, timestampsOmit } from '@/database/timestamps.ts';
import { medspas } from '@/medspas/medspas.schema.ts';

export const services = pgTable(
  'services',
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    price: integer().notNull(),
    duration: integer().notNull(),
    medspaId: uuid()
      .notNull()
      .references(() => medspas.id),
    ...timestamps,
  },
  (table) => [
    unique('services_medspa_id_name_unique').on(table.medspaId, table.name),
    unique('services_id_medspa_id_unique').on(table.id, table.medspaId),
  ]
);

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z });

export const serviceInsertSchema = createInsertSchema(services, {
  name: (schema) => schema.trim().min(1, 'Name must not be empty'),
  description: (schema) =>
    schema.trim().min(1, 'Description must not be empty').max(500),
  price: (schema) => schema.min(1, 'Price must be greater than 0'),
  duration: (schema) => schema.min(1, 'Duration must be greater than 0'),
}).omit({
  id: true,
  ...timestampsOmit,
});

export const serviceSelectSchema = createSelectSchema(services);
export const serviceIdSchema = z.object({
  serviceId: serviceSelectSchema.shape.id,
});

export const serviceUpdateSchema = createUpdateSchema(services, {
  name: (schema) => schema.trim().min(1, 'Name must not be empty'),
  description: (schema) =>
    schema.trim().min(1, 'Description must not be empty').max(500),
  price: (schema) => schema.min(1, 'Price must be greater than 0'),
  duration: (schema) => schema.min(1, 'Duration must be greater than 0'),
})
  .omit({
    id: true,
    medspaId: true,
    ...timestampsOmit,
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    'At least one field must be provided'
  );

export type Service = typeof services.$inferSelect;
export type ServiceInsertSchema = z.infer<typeof serviceInsertSchema>;
export type ServiceUpdateSchema = z.infer<typeof serviceUpdateSchema>;
