import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { type Result } from "axe-core";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { OrderStatusCode } from "../../models/TestOrder";
import { OrderBuilder } from "../../test-data/OrderBuilder";

interface OrderStatusStep {
  statusCode?: OrderStatusCode;
  stepName: string;
}

const ORDER_STATUS_STEPS: OrderStatusStep[] = [
  { stepName: "Status Confirmed" },
  { statusCode: "DISPATCHED", stepName: "Status Dispatched" },
  { statusCode: "RECEIVED", stepName: "Status Test received" },
  { statusCode: "COMPLETE", stepName: "Status Result Ready" },
];

let orderId: string;
let patientId: string;
const dbClient = new TestOrderDbClient();

test.describe("Accessibility Testing @accessibility", () => {
  test.beforeAll(async ({ testedUser }) => {
    await dbClient.connect();

    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
  });

  test("Home Test - Status Order Accessibility", async ({ orderStatusPage, accessibility }) => {
    const accessErrors: Result[] = [];

    for (const { statusCode, stepName } of ORDER_STATUS_STEPS) {
      await test.step(`Accessibility check: ${stepName}`, async () => {
        if (statusCode) {
          await dbClient.updateOrderStatus(orderId, statusCode);
        }

        await orderStatusPage.navigateToOrder(orderId);
        await orderStatusPage.waitForOrderToLoad();
        accessErrors.push(
          ...(await accessibility.runAccessibilityCheck(
            orderStatusPage,
            stepName,
            "Order Tracking Page",
          )),
        );
      });
    }

    expect(accessErrors).toHaveLength(0);
  });

  test.afterAll(async ({ testedUser }) => {
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    await dbClient.disconnect();
  });
});
