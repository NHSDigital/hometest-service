import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { expect } from "@playwright/test";
import { randomUUID } from "crypto";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();
let loggedInUser: NHSLoginMockedUser;
test.describe("Accessibility Testing @accessibility", () => {
  test.beforeEach(async ({loginUser, page }) => {
    await dbClient.connect();
    await resultDbClient.connect();
    loggedInUser = (await loginUser(page)).user;
    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(loggedInUser).withStatus("COMPLETE").build(),
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
      await negativeResultPage.openOrderResultDirect(orderId);
      await negativeResultPage.waitUntilPageLoaded();
      const accessErrors = await accessibility.runAccessibilityCheck(
        negativeResultPage.page,
        "Negative Result Page",
      );
      expect(accessErrors).toHaveLength(0);
    },
  );

  test.afterEach(async () => {
    await resultDbClient.deleteResultStatusByUid(orderId);
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteConsentByPatientUid(patientId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientMapping(loggedInUser.nhsNumber!, loggedInUser.dob!);
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
