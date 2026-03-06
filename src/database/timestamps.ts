import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp({ mode: 'date', withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({ mode: 'date', withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp({ mode: 'date', withTimezone: true, precision: 3 }),
};

export const timestampsOmit = Object.fromEntries(
  Object.keys(timestamps).map((key) => [key, true])
) as { [Field in keyof typeof timestamps]: true };
