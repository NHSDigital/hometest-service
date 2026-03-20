import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { type Result } from "axe-core";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { OrderStatusCode } from "../../models/TestOrder";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";

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
let loggedInUser: NHSLoginMockedUser;
const dbClient = new TestOrderDbClient();

test.describe("Accessibility Testing @accessibility", () => {
  test.beforeAll(async () => {
    await dbClient.connect();
  });

  test.beforeEach(async ({ loginUser, page }) => {
    const user = await loginUser(page);
    loggedInUser = user;
    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(user).build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
  });

  for (const { statusCode, stepName } of ORDER_STATUS_STEPS) {
    test(`Home Test - Status Order Accessibility: ${stepName}`, async ({
      orderStatusPage,
      accessibility,
    }) => {
      if (statusCode) {
        await dbClient.updateOrderStatus(orderId, statusCode);
      }

      await orderStatusPage.navigateToOrder(orderId);
      await orderStatusPage.waitForOrderToLoad();
      const accessErrors: Result[] = await accessibility.runAccessibilityCheck(
        orderStatusPage,
        stepName,
        "Order Tracking Page",
      );

      expect(accessErrors).toHaveLength(0);
    });
  }

  test.afterEach(async () => {
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteConsentByPatientUid(patientId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(loggedInUser.nhsNumber!, loggedInUser.dob!);
  });

  test.afterAll(async () => {
    await dbClient.disconnect();
  });
});
