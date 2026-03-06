import { eq, sql } from 'drizzle-orm';
import { AppointmentRepository } from '@/appointments/appointments.repository.ts';
import * as schema from '@/database/schema.ts';
import type { Medspa } from '@/medspas/medspas.schema.ts';
import type { Service } from '@/services/services.schema.ts';
import { createMedspa } from '../fixtures/create-medspa.ts';
import { createService } from '../fixtures/create-service.ts';
import {
  type TestDatabaseContext,
  createTestDatabase,
} from '../helpers/create-test-database.ts';

let ctx: TestDatabaseContext;
let appointmentRepository: AppointmentRepository;
let medspa: Medspa;
let otherMedspa: Medspa;
let serviceA: Service;
let serviceB: Service;
let otherService: Service;

const futureDate = () => new Date(Date.now() + 86_400_000);

beforeAll(async () => {
  ctx = await createTestDatabase();
  appointmentRepository = new AppointmentRepository(ctx.database);

  medspa = await createMedspa(ctx.database);
  otherMedspa = await createMedspa(ctx.database, {
    name: 'Other Spa',
    address: '456 Other St',
    phoneNumber: '+19995551234',
    email: 'other@spa.com',
  });

  serviceA = await createService(ctx.database, medspa.id, {
    name: 'Botox',
    description: 'Botox injection',
    price: 30000,
    duration: 30,
  });
  serviceB = await createService(ctx.database, medspa.id, {
    name: 'Filler',
    description: 'Dermal filler',
    price: 50000,
    duration: 60,
  });
  otherService = await createService(ctx.database, otherMedspa.id, {
    name: 'Laser',
    description: 'Laser treatment',
    price: 20000,
    duration: 45,
  });
}, 60_000);

afterEach(async () => {
  await ctx.database.execute(sql`truncate table appointments cascade`);
});

afterAll(() => ctx.teardown());

describe('AppointmentRepository', () => {
  describe('insert', () => {
    test('creates an appointment with correct `totalPrice`, `totalDuration`, and `status`', async () => {
      const result = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id, serviceB.id],
      });

      expect.assert(result.status === 'created');
      expect(result.data.id).toBeTypeOf('string');
      expect(result.data.medspaId).toStrictEqual(medspa.id);
      expect(result.data.status).toStrictEqual('scheduled');
      expect(result.data.totalPrice).toStrictEqual(
        serviceA.price + serviceB.price
      );
      expect(result.data.totalDuration).toStrictEqual(
        serviceA.duration + serviceB.duration
      );
      expect(result.data.scheduledAt).toBeInstanceOf(Date);
      expect(result.data.completedAt).toBeNull();
      expect(result.data.canceledAt).toBeNull();
    });

    test('stores price and duration snapshot in junction rows', async () => {
      const result = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id, serviceB.id],
      });
      expect.assert(result.status === 'created');

      const junctionRows = await ctx.database
        .select()
        .from(schema.appointmentServices)
        .where(eq(schema.appointmentServices.appointmentId, result.data.id));

      expect(junctionRows).toHaveLength(2);

      const rowA = junctionRows.find((row) => row.serviceId === serviceA.id);
      const rowB = junctionRows.find((row) => row.serviceId === serviceB.id);

      expect(rowA?.price).toStrictEqual(serviceA.price);
      expect(rowA?.duration).toStrictEqual(serviceA.duration);
      expect(rowB?.price).toStrictEqual(serviceB.price);
      expect(rowB?.duration).toStrictEqual(serviceB.duration);
    });

    test('returns `reference_not_found` with field `serviceIds` for non-existent serviceIds', async () => {
      const missingId = '00000000-0000-0000-0000-000000000000';
      const result = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [missingId],
      });

      expect.assert(result.status === 'reference_not_found');
      expect.assert(result.field === 'serviceIds');
      expect(result.missingIds).toStrictEqual([missingId]);
    });

    test('returns `reference_not_found` with field `serviceIds` when some serviceIds exist and some do not', async () => {
      const missingId = '00000000-0000-0000-0000-000000000000';
      const result = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id, missingId],
      });

      expect.assert(result.status === 'reference_not_found');
      expect.assert(result.field === 'serviceIds');
      expect(result.missingIds).toStrictEqual([missingId]);
    });

    test('returns `reference_not_found` with field `serviceIds` for serviceIds from a different medspa', async () => {
      const result = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [otherService.id],
      });

      expect.assert(result.status === 'reference_not_found');
      expect.assert(result.field === 'serviceIds');
      expect(result.missingIds).toStrictEqual([otherService.id]);
    });

    test('returns `reference_not_found` with field `medspaId` for non-existent medspaId', async () => {
      const result = await appointmentRepository.insert({
        medspaId: '00000000-0000-0000-0000-000000000000',
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });

      expect(result).toStrictEqual({
        status: 'reference_not_found',
        field: 'medspaId',
      });
    });
  });

  describe('update', () => {
    test('marks appointment as completed with `completedAt` set', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      const result = await appointmentRepository.update(insertResult.data.id, {
        status: 'completed',
      });

      expect.assert(result.status === 'updated');
      expect(result.data.status).toStrictEqual('completed');
      expect(result.data.completedAt).toBeInstanceOf(Date);
      expect(result.data.canceledAt).toBeNull();
    });

    test('marks appointment as canceled with `canceledAt` set', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      const result = await appointmentRepository.update(insertResult.data.id, {
        status: 'canceled',
      });

      expect.assert(result.status === 'updated');
      expect(result.data.status).toStrictEqual('canceled');
      expect(result.data.canceledAt).toBeInstanceOf(Date);
      expect(result.data.completedAt).toBeNull();
    });

    test('returns `not_found` for non-existent appointmentId', async () => {
      const result = await appointmentRepository.update(
        '00000000-0000-0000-0000-000000000000',
        { status: 'completed' }
      );

      expect(result).toStrictEqual({ status: 'not_found' });
    });

    test('returns `status_conflict` with `currentStatus` `completed` for already completed appointment', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      await appointmentRepository.update(insertResult.data.id, {
        status: 'completed',
      });

      const result = await appointmentRepository.update(insertResult.data.id, {
        status: 'canceled',
      });

      expect(result).toStrictEqual({
        status: 'status_conflict',
        currentStatus: 'completed',
      });
    });

    test('returns `status_conflict` with `currentStatus` `canceled` for already canceled appointment', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      await appointmentRepository.update(insertResult.data.id, {
        status: 'canceled',
      });

      const result = await appointmentRepository.update(insertResult.data.id, {
        status: 'completed',
      });

      expect(result).toStrictEqual({
        status: 'status_conflict',
        currentStatus: 'canceled',
      });
    });

    test('returns `not_found` for soft-deleted appointment', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      await ctx.database.execute(
        sql`update appointments set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await appointmentRepository.update(insertResult.data.id, {
        status: 'completed',
      });

      expect(result).toStrictEqual({ status: 'not_found' });
    });
  });

  describe('findAll', () => {
    test('returns all active appointments ordered by `createdAt` descending', async () => {
      const firstResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      const secondResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceB.id],
      });
      expect.assert(firstResult.status === 'created');
      expect.assert(secondResult.status === 'created');

      const result = await appointmentRepository.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.id).toStrictEqual(secondResult.data.id);
      expect(result.data[1]?.id).toStrictEqual(firstResult.data.id);
    });

    test('excludes soft-deleted appointments', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceB.id],
      });

      await ctx.database.execute(
        sql`update appointments set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await appointmentRepository.findAll();

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findById', () => {
    test('returns `found` with the appointment', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      const result = await appointmentRepository.findById(insertResult.data.id);

      expect.assert(result.status === 'found');
      expect(result.data.id).toStrictEqual(insertResult.data.id);
    });

    test('returns `not_found` for non-existent id', async () => {
      const result = await appointmentRepository.findById(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result).toStrictEqual({ status: 'not_found' });
    });

    test('returns `not_found` for soft-deleted appointment', async () => {
      const insertResult = await appointmentRepository.insert({
        medspaId: medspa.id,
        startTime: futureDate(),
        serviceIds: [serviceA.id],
      });
      expect.assert(insertResult.status === 'created');

      await ctx.database.execute(
        sql`update appointments set deleted_at = now() where id = ${insertResult.data.id}`
      );

      const result = await appointmentRepository.findById(insertResult.data.id);

      expect(result).toStrictEqual({ status: 'not_found' });
    });
  });
});
