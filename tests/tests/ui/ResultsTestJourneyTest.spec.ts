import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { randomUUID } from "node:crypto";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { NHSLoginMockedUser } from "../../utils/users/BaseUser";

let orderId: string;
let patientId: string;
let orderId2: string;
let patientId2: string;
let orderReference: number;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();
let loggedInUser: NHSLoginMockedUser;
const nhsNumber2 = "9876543211";
const birthDate2 = "1990-01-01";

test.describe("Results Page", { tag: "@ui" }, () => {
  test.beforeAll("Connect to the database and create second patient order", async () => {
    await dbClient.connect();
    await resultDbClient.connect();

  });

  test.beforeEach(
    "Create an order with SUBMITTED status for the tested user",
    async ({ loginUser, page }) => {
    const { user } = await loginUser(page);
    loggedInUser = user;
    const resultSecondPatient = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder()
        .withNhsNumber(nhsNumber2)
        .withBirthDate(birthDate2)
        .withStatus("SUBMITTED")
        .build(),
    );

    orderId2 = resultSecondPatient.order_uid;
    patientId2 = resultSecondPatient.patient_uid;
      const result = await dbClient.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(loggedInUser).withStatus("SUBMITTED").build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;
      orderReference = result.order_reference;
      console.log(`Created test order with ID: ${orderId} and reference: ${orderReference}`);
    },
  );

  test("Authenticated user opens a deep link - negative result", async ({ negativeResultPage }) => {
    await dbClient.updateOrderStatus(orderId, "COMPLETE");
    await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", randomUUID());
    expect(await resultDbClient.getResultStatusCountByOrderUid(orderId)).toBe(1);
    await negativeResultPage.openOrderResultDirect(orderId);
    await expect(negativeResultPage.result).toHaveText("Negative");
    const orderReferenceOnPage = await negativeResultPage.getOrderReference();
    expect(orderReferenceOnPage).toBe(orderReference);
  });

  test("Authenticated user opens a deep link - positive result", async ({
    negativeResultPage,
    orderStatusPage,
  }) => {
    await dbClient.updateOrderStatus(orderId, "RECEIVED");
    await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", randomUUID());
    await resultDbClient.updateResultStatus(orderId, "RESULT_WITHHELD");
    expect(await resultDbClient.getResultStatusCountByOrderUid(orderId)).toBe(1);
    // await negativeResultPage.navigateToOrderResultExpectingPath(
    //   orderId,
    //   orderStatusPage.statusTag,
    //   `/orders/${orderId}/tracking`,
    // );
    await negativeResultPage.openOrderResultDirect(orderId)
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

  // can be tested only not with wircemock auth as it bypasses NHS login and authorization
  //   test("Unauthenticated user opens a deep link", async ({
  //     config,
  //     negativeResultPage,
  //     nhsEmailAndPasswordPage,
  //   }) => {
  //     await dbClient.updateOrderStatus(orderId, "COMPLETE");
  //     await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", randomUUID());
  //     const context = negativeResultPage.page.context();
  //     await context.clearCookies();
  //     await context.clearPermissions();

  //     if (!config.useWiremockAuth) {
  //       await negativeResultPage.openOrderResultDirect(orderId);
  //       await expect(nhsEmailAndPasswordPage.emailInput).toBeVisible();
  //       return;
  //     }

  //     await negativeResultPage.navigateToOrderResult(orderId);
  //     await negativeResultPage.waitForResultsToLoad();
  //     await expect(negativeResultPage.result).toHaveText("Negative");
  //   });
  // });

  test.afterEach(
    "Delete result status, order status, order, and patient records from the database",
    async ({ testedUser }) => {
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(loggedInUser.nhsNumber!, loggedInUser.dob!);
          await resultDbClient.deleteResultStatusByUid(orderId2);
    await dbClient.deleteOrderStatusByUid(orderId2);
    await dbClient.deleteConsentByPatientUid(patientId2);
    await dbClient.deleteOrderByPatientUid(patientId2);
    await dbClient.deletePatientMapping(nhsNumber2, birthDate2);
    },
  );

  test.afterAll("Delete second patient records and disconnect from the database", async () => {
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
});
