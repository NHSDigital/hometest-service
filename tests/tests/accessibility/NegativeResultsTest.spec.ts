import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { expect } from "@playwright/test";
import { randomUUID } from "crypto";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();

test.describe("Accessibility Testing @accessibility", () => {
  test.beforeAll(async ({ testedUser }) => {
    await dbClient.connect();
    await resultDbClient.connect();

    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).withStatus("COMPLETE").build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = randomUUID();

    await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", correlationId);
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

  test.afterAll(async ({ testedUser }) => {
    await resultDbClient.deleteResultStatusByUid(orderId);
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
