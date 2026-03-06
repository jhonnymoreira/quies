import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, timestampsOmit } from '@/database/timestamps.ts';

export const medspas = pgTable('medspas', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 300 }).notNull().unique(),
  phoneNumber: varchar({ length: 16 }).notNull(),
  email: varchar({ length: 254 }).notNull(),
  ...timestamps,
});

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  zodInstance: z,
});

export const medspaInsertSchema = createInsertSchema(medspas, {
  name: (schema) => schema.trim().min(1, 'Name must not be empty'),
  address: (schema) => schema.trim().min(1, 'Address must not be empty'),
  phoneNumber: (schema) =>
    schema
      .trim()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Phone number must be in E.164 format (e.g. +12125551234)'
      ),
  email: () => z.email(),
}).omit({
  id: true,
  ...timestampsOmit,
});

const medspaSelectSchema = createSelectSchema(medspas);
export const medspaIdSchema = z.object({
  medspaId: medspaSelectSchema.shape.id,
});

export type Medspa = typeof medspas.$inferSelect;
export type MedspaInsertSchema = z.infer<typeof medspaInsertSchema>;
