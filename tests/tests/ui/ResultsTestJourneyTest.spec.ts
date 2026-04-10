import { randomUUID } from "node:crypto";

import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let orderId2: string;
let patientId2: string;
let orderReference: number;
const nhsNumber2 = "9876543211";
const birthDate2 = "1990-01-01";

test.describe("Results Page", { tag: ["@ui", "@db"] }, () => {
  test.beforeAll(
    "Connect to the database and create second patient order",
    async ({ testOrderDb }) => {
      const resultSecondPatient = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder()
          .withNhsNumber(nhsNumber2)
          .withBirthDate(birthDate2)
          .withStatus("SUBMITTED")
          .build(),
      );

      orderId2 = resultSecondPatient.order_uid;
      patientId2 = resultSecondPatient.patient_uid;
    },
  );

  test.beforeEach(
    "Create an order with SUBMITTED status for the tested user",
    async ({ testedUser, testOrderDb }) => {
      const result = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(testedUser).withStatus("SUBMITTED").build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;
      orderReference = result.order_reference;
      console.log(`Created test order with ID: ${orderId} and reference: ${orderReference}`);
    },
  );

  test("Authenticated user opens a deep link - negative result", async ({
    negativeResultPage,
    errorPage,
    testOrderDb,
    testResultDb,
  }) => {
    await testOrderDb.updateOrderStatus(orderId, "COMPLETE");
    await testResultDb.insertStatusResult(orderId, "RESULT_AVAILABLE", randomUUID());
    expect(await testResultDb.getResultStatusCountByOrderUid(orderId)).toBe(1);
    await negativeResultPage.navigateToOrderResult(orderId);
    await expect(errorPage.orderNotFoundMessage).not.toBeVisible();
    await expect(negativeResultPage.result).toHaveText("Negative");
    const orderReferenceOnPage = await negativeResultPage.getOrderReference();
    expect(orderReferenceOnPage).toBe(orderReference);
  });

  test("Authenticated user opens a deep link - positive result", async ({
    negativeResultPage,
    orderStatusPage,
    testOrderDb,
    testResultDb,
  }) => {
    await testOrderDb.updateOrderStatus(orderId, "RECEIVED");
    await testResultDb.insertStatusResult(orderId, "RESULT_AVAILABLE", randomUUID());
    await testResultDb.updateResultStatus(orderId, "RESULT_WITHHELD");
    expect(await testResultDb.getResultStatusCountByOrderUid(orderId)).toBe(1);
    await negativeResultPage.navigateToOrderResultExpectingPath(
      orderId,
      orderStatusPage.statusTag,
      `/orders/${orderId}/tracking`,
    );
    await expect(orderStatusPage.statusTag).toHaveText("Test received");
    const url = await orderStatusPage.getCurrentUrl();
    expect(url).toContain("/tracking");
  });

  test.describe("Unauthorized access", () => {
    test.use({
      errorCaptureOptions: {
        failOnConsoleError: false,
        failOnNetworkError: false,
      },
    });

    test("Unauthorized user opens a deep link", async ({ negativeResultPage, errorPage }) => {
      await negativeResultPage.navigateToOrderResultExpectingPath(
        orderId2,
        errorPage.orderNotFoundMessage,
        `/orders/${orderId2}/tracking`,
      );
      await expect(errorPage.orderNotFoundMessage).toBeVisible();
      const url = await negativeResultPage.getCurrentUrl();
      expect(url).toContain(`/orders/${orderId2}/tracking`);
    });
  });

  test.afterEach(
    "Delete result status, order status, order, and patient records from the database",
    async ({ testedUser, testOrderDb, testResultDb }) => {
      await testResultDb.deleteResultStatusByUid(orderId);
      await testOrderDb.deleteOrderStatusByUid(orderId);
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderByPatientUid(patientId);
      await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );

  test.afterAll(
    "Delete second patient records and disconnect from the database",
    async ({ testOrderDb, testResultDb }) => {
      await testResultDb.deleteResultStatusByUid(orderId2);
      await testOrderDb.deleteOrderStatusByUid(orderId2);
      await testOrderDb.deleteConsentByPatientUid(patientId2);
      await testOrderDb.deleteOrderByPatientUid(patientId2);
      await testOrderDb.deletePatientMapping(nhsNumber2, birthDate2);
    },
  );
});
