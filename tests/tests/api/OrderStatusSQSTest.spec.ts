import { test, expect } from '../../fixtures/IntegrationFixture';
import { CreateOrderResponseModel } from '../../models/CreateOrderResponse';
import { isValidOrder } from '../../models/TestOrder';
import { OrderTestData } from '../../test-data/OrderTestData';
import { headersOrder } from '../../utils/ApiRequestHelper';
import { TestOrderDbClient } from '../../db/TestOrderDbClient';

test.describe('Created an Order to place in SQS', () => {
    let createdOrderUid: string;

    test.afterEach(async ({ testOrderDb }) => {
        await testOrderDb.deleteOrderByUid(createdOrderUid);
    });

    test('POST request, should create an order and verify its presence in the database and Check the status SQS as Queued',
        { tag: ['@api'] },
        async ({ orderApi, testOrderDb }) => {
            const payload = OrderTestData.getDefaultOrder();
            const response = await orderApi.createOrder(payload, headersOrder);
            expect(response.status()).toBe(201);
            const orderResponse = CreateOrderResponseModel.fromJson(
                await response.json()
            );

            expect(orderResponse.isValidResponse()).toBe(true);
            expect(orderResponse.message).toBe('Order created successfully');
            createdOrderUid = orderResponse.orderUid;
            const order = await testOrderDb.getOrderByUid(createdOrderUid);
            expect(order).toBeDefined();
            expect(isValidOrder(order!)).toBe(true);
            expect(order!.order_uid).toBe(createdOrderUid);
            expect(order!.test_code).toBe(payload.testCode);
            expect(order!.nhs_number).toBe(payload.patient.nhsNumber);
            const statusRow = await testOrderDb.getLatestOrderStatusByOrderUid(createdOrderUid);
            expect(statusRow?.status_code).toBe('QUEUED');
        }
    );
});
