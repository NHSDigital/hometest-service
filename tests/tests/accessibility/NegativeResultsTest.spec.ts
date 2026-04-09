import { randomUUID } from "crypto";

import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let correlationId: string;

test.describe("Accessibility Testing @accessibility", { tag: ["@accessibility", "@db"] }, () => {
  test.beforeAll(async ({ testedUser, testOrderDb, testResultDb }) => {
    const result = await testOrderDb.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).withStatus("COMPLETE").build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = randomUUID();

    await testResultDb.insertStatusResult(orderId, "RESULT_AVAILABLE", correlationId);
  });

  test(
    "Negative Result Page",
    {
      tag: ["@accessibility"],
    },
    async ({ negativeResultPage, accessibility }) => {
      await negativeResultPage.navigateToOrderResult(orderId);
      await negativeResultPage.waitForResultsToLoad();
      const accessErrors = await accessibility.runAccessibilityCheck(
        negativeResultPage.page,
        "Negative Result Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );

  test.afterAll(async ({ testedUser, testOrderDb, testResultDb }) => {
    await testResultDb.deleteResultStatusByUid(orderId);
    await testOrderDb.deleteOrderStatusByUid(orderId);
    await testOrderDb.deleteConsentByPatientUid(patientId);
    await testOrderDb.deleteOrderByPatientUid(patientId);
    await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
  });
});
