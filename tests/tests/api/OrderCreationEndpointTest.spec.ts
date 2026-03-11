import { test, expect } from "../../fixtures/IntegrationFixture";
import { CreateOrderResponseModel } from "../../models/CreateOrderResponse";
import { OrderTestData } from "../../test-data/OrderTestData";
import { headersOrder } from "../../utils/ApiRequestHelper";

test.describe("Backend API, order endpoint", () => {
  const payload = OrderTestData.getDefaultOrder();
  let createdOrderUid: string;
  let patientUid: string | undefined;

  test(
    "POST request, should create an order and verify its presence in the database",
    { tag: ["@api"] },
    async ({ orderApi, testOrderDb }) => {
      const response = await orderApi.createOrder(payload, headersOrder);
      expect(response.status()).toEqual(201);

      const orderResponse = CreateOrderResponseModel.fromJson(await response.json());
      createdOrderUid = orderResponse.orderUid;

      const order = await testOrderDb.getOrderByUid(createdOrderUid);
      expect(order).toBeDefined();
      expect(order!.test_code).toBe(payload.testCode);
      expect(order!.nhs_number).toBe(payload.patient.nhsNumber);

      patientUid = order?.patient_uid;

      await expect
        .poll(async () => (await testOrderDb.getOrderStatusesByOrderUid(createdOrderUid))?.length)
        .toBe(3);
      const statusRows = await testOrderDb.getOrderStatusesByOrderUid(createdOrderUid);
      expect(statusRows?.[2].status_code).toBe("GENERATED");
      expect(statusRows?.[1].status_code).toBe("QUEUED");
      expect(statusRows?.[0].status_code).toBe("SUBMITTED");
    },
  );

  test.afterEach(async ({ testOrderDb }) => {
    await testOrderDb.deleteOrderByUid(createdOrderUid);
    await testOrderDb.deleteOrderByPatientUid(patientUid!);
    await testOrderDb.deletePatientMapping(payload.patient.nhsNumber, payload.patient.birthDate);
  });
});
