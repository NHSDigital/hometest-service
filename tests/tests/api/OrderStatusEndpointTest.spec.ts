import { test } from "../../fixtures/CombinedTestFixture";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { OrderBuilder } from "../../test-data/OrderBuilder";

test.describe("GET Order API", () => {
  const dbClient = new TestOrderDbClient();
  let orderId: string;
  let patientId: string;

  test.beforeAll(async ({ testedUser }) => {
    await dbClient.connect();
    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
  });

  test(
    "should retrieve order and confirm status changes",
    { tag: ["@API"] },
    async ({ orderApi, testedUser }) => {
      const nhsNumber = testedUser.nhsNumber!;
      const dob = testedUser.dob!;

      await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, "CONFIRMED");

      await dbClient.updateOrderStatus(orderId, "DISPATCHED");
      await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, "DISPATCHED");

      await dbClient.updateOrderStatus(orderId, "RECEIVED");
      await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, "RECEIVED");

      await dbClient.updateOrderStatus(orderId, "COMPLETE");
      await orderApi.assertOrderHasStatus(nhsNumber, dob, orderId, "COMPLETE");
    },
  );

  test.afterAll(async ({ testedUser }) => {
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteConsentByPatientUid(patientId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    await dbClient.disconnect();
  });
});
