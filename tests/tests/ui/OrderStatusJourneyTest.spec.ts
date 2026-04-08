import { expect } from "@playwright/test";

import { AuthType, ConfigFactory } from "../../configuration/EnvironmentConfiguration";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderStatusCode } from "../../models/TestOrder";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { type NHSLoginUser } from "../../utils/users";

let orderId: string;
let patientId: string;
let orderId2: string;
let patientId2: string;
let orderReference: number;
const nhsNumber2 = "9876543211";
const birthDate2 = "1990-01-01";
const config = ConfigFactory.getConfig();

test.describe("Order Status Page", { tag: "@db" }, () => {
  test.beforeAll(
    "Connect to the database and create a patient, order, initial order status and result status",
    async ({ testedUser, testOrderDb }) => {
      const result = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(testedUser).build(),
      );

      const resultSecondPatient = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder()
          .withNhsNumber(nhsNumber2)
          .withBirthDate(birthDate2)
          .withSupplier("SH:24")
          .build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;
      orderReference = result.order_reference;
      console.log(`Created test order with ID: ${orderId} and reference: ${orderReference}`);

      orderId2 = resultSecondPatient.order_uid;
      patientId2 = resultSecondPatient.patient_uid;
      console.log(`Created second test order with ID: ${orderId2}`);
    },
  );

  interface OrderStatus {
    status: OrderStatusCode;
    tag: string;
  }

  const ORDER_STATUS: OrderStatus[] = [
    { status: "SUBMITTED", tag: "Confirmed" },
    { status: "DISPATCHED", tag: "Dispatched" },
    { status: "RECEIVED", tag: "Test received" },
  ];

  test("Authenticated user opens a deep link - Order confirmed", async ({
    orderStatusPage,
    errorPage,
    testOrderDb,
  }) => {
    expect((await testOrderDb.getLatestOrderStatusWithCountByOrderUid(orderId)).count).toBe(1);
    await orderStatusPage.navigateToOrder(orderId);
    await expect(errorPage.orderNotFoundMessage).not.toBeVisible();
    await expect(orderStatusPage.statusTag).toHaveText("Confirmed");
    const orderReferenceOnPage = await orderStatusPage.getOrderReference();
    expect(orderReferenceOnPage).toBe(orderReference);
  });

  for (const { status, tag } of ORDER_STATUS) {
    test(`Authenticated user opens a deep link - Order status is ${status}`, async ({
      orderStatusPage,
      errorPage,
      testOrderDb,
    }) => {
      await testOrderDb.updateOrderStatus(orderId, status);
      expect((await testOrderDb.getLatestOrderStatusWithCountByOrderUid(orderId)).count).toBe(1);
      await orderStatusPage.navigateToOrder(orderId);
      await expect(errorPage.orderNotFoundMessage).not.toBeVisible();
      await expect(orderStatusPage.statusTag).toHaveText(tag);
      const orderReferenceOnPage = await orderStatusPage.getOrderReference();
      expect(orderReferenceOnPage).toBe(orderReference);
    });
  }

  test.describe("Unauthorized access", () => {
    test.use({
      errorCaptureOptions: {
        failOnConsoleError: false,
        failOnNetworkError: false,
      },
    });

    test("Unauthorized user opens a deep link", async ({ orderStatusPage, errorPage }) => {
      await orderStatusPage.navigateToOrderExpectingPath(
        orderId2,
        errorPage.orderNotFoundMessage,
        `/orders/${orderId2}/tracking`,
      );
      await expect(errorPage.orderNotFoundMessage).toBeVisible();
      const url = await orderStatusPage.getCurrentUrl();
      expect(url).toContain(`/orders/${orderId2}/tracking`);
    });

    test("Unauthenticated user opens a deep link", async ({
      orderStatusPage,
      nhsEmailAndPasswordPage,
      codeSecurityPage,
      testedUser,
      errorPage,
      testOrderDb,
    }) => {
      await testOrderDb.updateOrderStatus(orderId, "RECEIVED");
      const context = orderStatusPage.page.context();
      await context.clearCookies();
      await context.clearPermissions();

      await orderStatusPage.openOrderDirect(orderId);

      if (config.authType === AuthType.WIREMOCK) {
        await orderStatusPage.waitForOrderToLoad();
      } else {
        await expect(nhsEmailAndPasswordPage.emailInput).toBeVisible();
        await nhsEmailAndPasswordPage.fillAuthFormWithCredentialsAndClickContinue(
          testedUser as NHSLoginUser,
        );
        await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
          (testedUser as NHSLoginUser).otp,
        );
      }

      await expect(errorPage.orderNotFoundMessage).not.toBeVisible();
      await expect(orderStatusPage.statusTag).toHaveText("Test received");
      const url = await orderStatusPage.getCurrentUrl();
      expect(url).toContain(`/orders/${orderId}/tracking`);
    });
  });

  test.afterAll(
    "Delete result status, order status, order, and patient records from the database and disconnect",
    async ({ testedUser, testOrderDb }) => {
      await testOrderDb.deleteOrderStatusByUid(orderId);
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderByPatientUid(patientId);
      await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
      await testOrderDb.deleteOrderStatusByUid(orderId2);
      await testOrderDb.deleteConsentByPatientUid(patientId2);
      await testOrderDb.deleteOrderByPatientUid(patientId2);
      await testOrderDb.deletePatientMapping(nhsNumber2, birthDate2);
    },
  );
});
