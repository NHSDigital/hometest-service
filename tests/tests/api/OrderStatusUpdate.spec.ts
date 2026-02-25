import { randomUUID } from 'crypto';
import { test, expect } from '../../fixtures/IntegrationFixture';
import { OrderStatusTaskPayload } from '../../test-data/OrderStatusTypes';
import { faker } from '@faker-js/faker';

const supplierId = 'c1a2b3c4-1234-4def-8abc-123456789abc';
const testCode = '31676001';
const originator = 'automation-test';
const defaultStatus = 'in-progress';
const defaultIntent = 'order';

const businessStatusCases = [
  { businessStatus: 'dispatched', expectedStatusCode: 'DISPATCHED' },
  { businessStatus: 'received-at-lab', expectedStatusCode: 'RECEIVED' },
] as const;

const buildHeaders = (correlationId: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Correlation-ID': correlationId,
});

test.describe('Order Status Update API', () => {
  let orderUid: string;
  let patientUid: string;
  let nhsNumber: string;
  let birthDate: string;

  const buildTaskPayload = (overrides: Partial<OrderStatusTaskPayload> = {}): OrderStatusTaskPayload => ({
    resourceType: 'Task',
    status: defaultStatus,
    intent: defaultIntent,
    basedOn: [{ reference: `Order/${orderUid}` }],
    for: { reference: `Patient/${patientUid}` },
    businessStatus: { text: 'dispatched' },
    lastModified: new Date().toISOString(),
    ...overrides,
  });

  test.beforeEach(async () => {
    orderUid = randomUUID();
    patientUid = randomUUID();
    nhsNumber = `99${faker.number.int({ min: 100000000, max: 999999999 })}`;
    birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];
  });

  test.beforeEach(async ({ testOrderDb }) => {
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
    await testOrderDb.deleteOrderStatusByUid(orderUid);
    await testOrderDb.deleteOrderByUid(orderUid);
    await testOrderDb.deletePatientMappingByUid(patientUid);
  });

  for (const { businessStatus, expectedStatusCode } of businessStatusCases) {
    test(`success (200) persists ${businessStatus} status`, async ({ orderStatusApi, testOrderDb }) => {
      const response = await orderStatusApi.updateOrderStatus(
        buildTaskPayload({ businessStatus: { text: businessStatus } }),
        buildHeaders(randomUUID()),
      );

      orderStatusApi.validateResponse(response, 200);

      const statusRow = await testOrderDb.getLatestOrderStatusByOrderUid(orderUid);
      expect(statusRow?.status_code).toBe(expectedStatusCode);
    });
  }
});
