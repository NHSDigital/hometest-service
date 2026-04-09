import { expect } from "@playwright/test";
import { type Result } from "axe-core";

import { test } from "../../fixtures/CombinedTestFixture";
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

test.describe("Accessibility Testing @accessibility", { tag: ["@accessibility", "@db"] }, () => {
  test.beforeEach(async ({ testedUser, testOrderDb }) => {
    const result = await testOrderDb.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
  });

  for (const { statusCode, stepName } of ORDER_STATUS_STEPS) {
    test(`Home Test - Status Order Accessibility: ${stepName}`, async ({
      orderStatusPage,
      accessibility,
      testOrderDb,
    }) => {
      if (statusCode) {
        await testOrderDb.updateOrderStatus(orderId, statusCode);
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

  test.afterEach(async ({ testedUser, testOrderDb }) => {
    await testOrderDb.deleteOrderStatusByUid(orderId);
    await testOrderDb.deleteConsentByPatientUid(patientId);
    await testOrderDb.deleteOrderByPatientUid(patientId);
    await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
  });
});
