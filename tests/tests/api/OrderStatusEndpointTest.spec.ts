import { test } from "../../fixtures/CombinedTestFixture";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { WireMockUserManager } from "../../utils/users/WireMockUserManager";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";

test.describe("GET Order API", () => {
  const dbClient = new TestOrderDbClient();
  let orderId: string;
  let patientId: string;
  let testedUser: NHSLoginMockedUser;

  test.beforeAll(async () => {
    testedUser = new WireMockUserManager(1).getWorkerUsers()[0];
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
    async ({ orderApi }) => {
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

  test.afterAll(async () => {
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteConsentByPatientUid(patientId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    await dbClient.disconnect();
  });
});
