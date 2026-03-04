import { test } from '../../fixtures/CombinedTestFixture';
import { TestOrderDbClient } from '../../db/TestOrderDbClient';

test.describe('GET Order API @api', () => {
  const dbClient = new TestOrderDbClient();
  let orderId: string;
  let patientId: string;

  test.beforeAll(async ({ testedUser }) => {
    await dbClient.connect();
    const result = await dbClient.createOrderWithPatientAndStatus({
      nhs_number: testedUser.nhsNumber!,
      birth_date: testedUser.dob!,
      supplier_name: 'Preventx',
      test_code: 'PCR',
      initial_status: 'ORDER_RECEIVED'
    });

    orderId = result.order_uid;
    patientId = result.patient_uid;
  });

  test('should retrieve order and confirm status changes', async ({
    orderApi,
    testedUser
  }) => {
    const nhsNumber = testedUser.nhsNumber!;
    const dob = testedUser.dob!;

    await orderApi.assertOrderHasStatus(
      nhsNumber,
      dob,
      orderId,
      'ORDER_RECEIVED'
    );

    await dbClient.updateOrderStatus(orderId, 'DISPATCHED');
    await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, 'DISPATCHED');

    await dbClient.updateOrderStatus(orderId, 'RECEIVED');
    await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, 'RECEIVED');

    await dbClient.updateOrderStatus(orderId, 'COMPLETE');
    await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, 'COMPLETE');
  });

  test.afterAll(async ({ testedUser }) => {
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(
      testedUser.nhsNumber!,
      testedUser.dob!
    );
    await dbClient.disconnect();
  });
});
