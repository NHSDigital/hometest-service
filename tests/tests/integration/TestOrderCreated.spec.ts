import { test, expect } from '../../fixtures/IntegrationFixture';
import { CreateOrderResponseModel } from '../../models/CreateOrderResponse';
import { TestOrderModel } from '../../models/TestOrder';
import { OrderTestData } from '../../test-data/OrderTestData';
import { headersOrder } from '../../test-data/HeadersOrder';

test.describe('Order Creation Integration Tests', () => {
  let createdOrderUid: string;

  test.afterEach(async ({ testOrderDb }) => {
    await testOrderDb.deleteOrderByUid(createdOrderUid);
  });

  test("should create an order via API and verify its presence in the database", async ({ orderApi, testOrderDb }) => {
    const payload = OrderTestData.getDefaultOrder();

    const response = await orderApi.createOrder(payload, headersOrder);
    orderApi.validateResponse(response, 201);

    const orderResponse = CreateOrderResponseModel.fromJson(await response.json());
    expect(orderResponse.isValidResponse()).toBe(true);
    expect(orderResponse.message).toBe('Order created successfully');

    createdOrderUid = orderResponse.orderUid;
    const row = await testOrderDb.getOrderByUid(createdOrderUid);
    expect(row).toBeDefined();
    const order = TestOrderModel.fromRow(row!);
    expect(order.isValidOrder()).toBe(true);
    expect(order.order_uid).toBe(createdOrderUid);
    expect(order.test_code).toBe(payload.testCode);
    expect(order.nhs_number).toBe(payload.patient.nhsNumber);
  });
});
