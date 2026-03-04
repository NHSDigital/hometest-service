import { test, expect } from '../../fixtures/IntegrationFixture';
import { CreateOrderResponseModel } from '../../models/CreateOrderResponse';
import { isValidOrder } from '../../models/TestOrder';
import { OrderTestData } from '../../test-data/OrderTestData';
import { headersOrder } from '../../utils/ApiRequestHelper';

test.describe('Backend API, order endpoint', () => {
  let createdOrderUid: string;
  let patientUid: string | undefined;


  test(
    'POST request, should create an order and verify its presence in the database',
    { tag: ['@api'] },
    async ({ orderApi, testOrderDb }) => {
      const payload = OrderTestData.getDefaultOrder();
      const response = await orderApi.createOrder(payload, headersOrder);
      expect(response.status()).toBe(201);
      const orderResponse = CreateOrderResponseModel.fromJson(
        await response.json()
      );
      console.log('Order Creation Response:', orderResponse);
      expect(orderResponse.isValidResponse()).toBe(true);
      expect(orderResponse.message).toBe('Order created successfully');
      createdOrderUid = orderResponse.orderUid;
      const order = await testOrderDb.getOrderByUid(createdOrderUid);
      expect(order).toBeDefined();
      expect(isValidOrder(order!)).toBe(true);
      expect(order!.order_uid).toBe(createdOrderUid);
      expect(order!.test_code).toBe(payload.testCode);
      expect(order!.nhs_number).toBe(payload.patient.nhsNumber);
      const statusRows = await testOrderDb.getOrderStatusesByOrderUid(createdOrderUid);
      patientUid = await testOrderDb.getOrderByUid(createdOrderUid).then(order => order?.patient_uid);
      expect(statusRows?.[1].status_code).toBe('GENERATED');
      expect(statusRows?.[0].status_code).toBe('QUEUED');
    }
  );

  test.afterEach(async ({ testOrderDb }) => {
    await testOrderDb.deleteOrderByUid(createdOrderUid);
    await testOrderDb.deleteOrderByPatientUid(patientUid!);
    await testOrderDb.deletePatientMapping(
      OrderTestData.getDefaultOrder().patient.nhsNumber,
      OrderTestData.getDefaultOrder().patient.birthDate
    );
  });
});
