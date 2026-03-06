import { and, desc, eq, isNull } from 'drizzle-orm';
import { UniqueViolationError } from '@/database/errors/unique-violation-error.ts';
import { Repository } from '@/database/repository.ts';
import type {
  Created,
  Duplicate,
  Found,
  NotFound,
  ReferenceNotFound,
  Updated,
} from '@/database/result-types.ts';
import { type Medspa, medspas } from '@/medspas/medspas.schema.ts';
import {
  type Service,
  type ServiceInsertSchema,
  type ServiceUpdateSchema,
  services,
} from './services.schema.ts';

type ServiceInsertResult =
  | Created<Service>
  | Duplicate<'medspa_id_name'>
  | ReferenceNotFound<'medspaId'>;

type ServiceUpdateResult =
  | Updated<Service>
  | NotFound
  | Duplicate<'medspa_id_name'>;

type ServiceFindByIdResult = Found<Service> | NotFound;

type ServiceFindAllByMedspaIdResult =
  | Found<Service[]>
  | ReferenceNotFound<'medspaId'>;

export class ServiceRepository extends Repository {
  async insert(service: ServiceInsertSchema): Promise<ServiceInsertResult> {
    try {
      return await this.execute(() =>
        this.database.transaction(async (transaction) => {
          const [medspa] = await transaction
            .select({ id: medspas.id })
            .from(medspas)
            .where(
              and(eq(medspas.id, service.medspaId), isNull(medspas.deletedAt))
            );

          if (!medspa) {
            return {
              status: 'reference_not_found',
              field: 'medspaId',
            };
          }

          const [row] = await transaction
            .insert(services)
            .values(service)
            .returning();

          if (!row) {
            throw new Error('Insert returned no rows');
          }

          return { status: 'created', data: row };
        })
      );
    } catch (error) {
      if (error instanceof UniqueViolationError) {
        return { status: 'duplicate', constraint: 'medspa_id_name' };
      }

      throw error;
    }
  }

  async update(
    serviceId: Service['id'],
    service: ServiceUpdateSchema
  ): Promise<ServiceUpdateResult> {
    try {
      const [row] = await this.execute(() =>
        this.database
          .update(services)
          .set(service)
          .where(and(eq(services.id, serviceId), isNull(services.deletedAt)))
          .returning()
      );
      if (!row) {
        return { status: 'not_found' };
      }

      return { status: 'updated', data: row };
    } catch (error) {
      if (error instanceof UniqueViolationError) {
        return { status: 'duplicate', constraint: 'medspa_id_name' };
      }

      throw error;
    }
  }

  async findById(serviceId: Service['id']): Promise<ServiceFindByIdResult> {
    const [row] = await this.execute(() =>
      this.database
        .select()
        .from(services)
        .where(and(eq(services.id, serviceId), isNull(services.deletedAt)))
    );

    if (!row) {
      return { status: 'not_found' };
    }

    return { status: 'found', data: row };
  }

  async findAllByMedspaId(
    medspaId: Medspa['id']
  ): Promise<ServiceFindAllByMedspaIdResult> {
    const rows = await this.execute(() =>
      this.database
        .select()
        .from(medspas)
        .leftJoin(
          services,
          and(eq(services.medspaId, medspas.id), isNull(services.deletedAt))
        )
        .where(and(eq(medspas.id, medspaId), isNull(medspas.deletedAt)))
        .orderBy(desc(services.createdAt))
    );

    if (rows.length === 0) {
      return { status: 'reference_not_found', field: 'medspaId' };
    }

    const data = rows
      .map((row) => row.services)
      .filter((service) => service !== null);

    return { status: 'found', data };
  }
}
