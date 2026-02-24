import { randomUUID } from 'crypto';
import { test, expect } from '../../fixtures/IntegrationFixture';
import { OrderStatusTaskPayload } from '../../api/clients/OrderStatusApiResource';

const supplierId = 'c1a2b3c4-1234-4def-8abc-123456789abc';
const testCode = '31676001';
const originator = 'playwright-test';
const defaultStatus = 'in-progress';
const defaultIntent = 'order';
const defaultBusinessStatus = 'dispatched';
const defaultLastModified = '2026-02-17T12:50:00Z';

const buildHeaders = (correlationId: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Correlation-ID': correlationId,
});

test.describe('Order Status Update API', () => {
  let orderUid: string;
  let patientUid: string;
  let nhsNumber: string;

  const buildTaskPayload = (overrides: Partial<OrderStatusTaskPayload> = {}): OrderStatusTaskPayload => ({
    resourceType: 'Task',
    status: defaultStatus,
    intent: defaultIntent,
    basedOn: [{ reference: `Order/${orderUid}` }],
    for: { reference: `Patient/${patientUid}` },
    businessStatus: { text: defaultBusinessStatus },
    lastModified: defaultLastModified,
    ...overrides,
  });

  test.beforeEach(async ({ testOrderDb }) => {
    orderUid = randomUUID();
    patientUid = randomUUID();
    nhsNumber = `99${Math.floor(Math.random() * 1_000_000_000)}`;

    const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const birthDate = `1988-${randomMonth}-${randomDay}`;

    await testOrderDb.insertPatientMapping({
      patientUid,
      nhsNumber,
      birthDate,
    });

    await testOrderDb.insertTestOrder({
      orderUid,
      supplierId,
      patientUid,
      testCode,
      originator,
    });
  });

  test.afterEach(async ({ testOrderDb }) => {
    await testOrderDb.deleteOrderByUid(orderUid);
    await testOrderDb.deletePatientMappingByUid(patientUid);
  });

  test('success (200)', async ({ orderStatusApi }) => {
    const response = await orderStatusApi.updateOrderStatus(
      buildTaskPayload(),
      buildHeaders(randomUUID()),
    );

    orderStatusApi.validateResponse(response, 200);
  });

  // test('incorrect business status (400)', async ({ orderStatusApi }) => {
  //   const response = await orderStatusApi.updateOrderStatus(
  //     buildTaskPayload({ businessStatus: { text: 'invalid-business-status' } }),
  //     buildHeaders(randomUUID()),
  //   );

  //   expect(response.status()).toBe(400);
  // });

  // test('missing business status (400)', async ({ orderStatusApi }) => {
  //   const payload = buildTaskPayload();
  //   delete payload.businessStatus;

  //   const response = await orderStatusApi.updateOrderStatus(
  //     payload,
  //     buildHeaders(randomUUID()),
  //   );

  //   expect(response.status()).toBe(400);
  // });

  // test('order not found (404)', async ({ orderStatusApi }) => {
  //   const missingOrderUid = randomUUID();
  //   const payload = buildTaskPayload({
  //     basedOn: [{ reference: `Order/${missingOrderUid}` }],
  //   });

  //   const response = await orderStatusApi.updateOrderStatus(
  //     payload,
  //     buildHeaders(randomUUID()),
  //   );

  //   expect(response.status()).toBe(404);
  // });

  // test('patient mismatch (400)', async ({ orderStatusApi }) => {
  //   const payload = buildTaskPayload({
  //     for: { reference: `Patient/${randomUUID()}` },
  //   });

  //   const response = await orderStatusApi.updateOrderStatus(
  //     payload,
  //     buildHeaders(randomUUID()),
  //   );

  //   expect(response.status()).toBe(400);
  // });

  // test('idempotency via correlation id (200)', async ({ orderStatusApi, testOrderDb }) => {
  //   const correlationId = randomUUID();

  //   await testOrderDb.insertOrderStatus({
  //     orderUid,
  //     statusCode: 'DISPATCHED',
  //     createdAt: '2026-02-17T12:40:00Z',
  //     correlationId,
  //   });

  //   const response = await orderStatusApi.updateOrderStatus(
  //     buildTaskPayload(),
  //     buildHeaders(correlationId),
  //   );

  //   orderStatusApi.validateResponse(response, 200);
  // });

  // test('missing lastModified (400)', async ({ orderStatusApi }) => {
  //   const payload = buildTaskPayload();
  //   delete payload.lastModified;

  //   const response = await orderStatusApi.updateOrderStatus(
  //     payload,
  //     buildHeaders(randomUUID()),
  //   );

  //   expect(response.status()).toBe(400);
  // });
});
