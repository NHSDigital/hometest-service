import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderStatusCode } from "../../models/TestOrder";
import { localUser } from "../../users";

let orderId: string;
let patientId: string;
let orderId2: string;
let patientId2: string;
let orderReference: number;
const dbClient = new TestOrderDbClient();
const nhsNumber2 = "9876543211";
const birthDate2 = "1990-01-01";

test.describe("Order Status Page", () => {
  test.beforeAll(
    "Connect to the database and create a patient, order, initial order status and result status",
    async ({ testedUser }) => {
      await dbClient.connect();

      const result = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: testedUser.nhsNumber!,
        birth_date: testedUser.dob!,
        supplier_name: "Preventx",
        test_code: "PCR",
        initial_status: "CONFIRMED",
      });

      const resultSecondPatient = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: nhsNumber2,
        birth_date: birthDate2,
        supplier_name: "SH:24",
        test_code: "PCR",
        initial_status: "RECEIVED",
      });

      orderId = result.order_uid;
      patientId = result.patient_uid;
      orderReference = result.order_reference;
      console.log(`Created test order with ID: ${orderId} and reference: ${orderReference}`);
      console.log(`Created second test order with ID: ${orderId2}`);

      orderId2 = resultSecondPatient.order_uid;
      patientId2 = resultSecondPatient.patient_uid;
    },
  );

  interface OrderStatus {
    status: OrderStatusCode;
    tag: string;
  }

  const ORDER_STATUS: OrderStatus[] = [
    { status: "DISPATCHED", tag: "Dispatched" },
    { status: "RECEIVED", tag: "Test received" },
  ];

  test("Authenticated user opens a deep link - Order confirmed", async ({ orderStatusPage }) => {
    await orderStatusPage.navigateToOrder(orderId);
    await expect(orderStatusPage.statusTag).toHaveText("Confirmed");
    const orderReferenceOnPage = await orderStatusPage.getOrderReference();
    expect(orderReferenceOnPage).toBe(orderReference);
  });

  for (const { status, tag } of ORDER_STATUS) {
    test(`Authenticated user opens a deep link - Order status is ${status}`, async ({
      orderStatusPage,
    }) => {
      await dbClient.updateOrderStatus(orderId, status);
      await orderStatusPage.navigateToOrder(orderId);
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
      await orderStatusPage.navigateToOrder(orderId2);
      await expect(errorPage.orderNotFoundMessage).toBeVisible();
    });

    test("Unauthenticated user opens a deep link", async ({
      orderStatusPage,
      nhsEmailAndPasswordPage,
      codeSecurityPage,
    }) => {
      const context = orderStatusPage.page.context();
      await context.clearCookies();
      await context.clearPermissions();
      await orderStatusPage.navigateToOrder(orderId);
      await expect(nhsEmailAndPasswordPage.emailInput).toBeVisible();
      await nhsEmailAndPasswordPage.fillAuthFormWithCredentialsAndClickContinue(localUser);
      await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(localUser.otp!);
      await expect(orderStatusPage.statusTag).toHaveText("Test received");
      const url = await orderStatusPage.getCurrentUrl();
      expect(url).toContain(orderId);
    });
  });

  test.afterAll(
    "Delete result status, order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
      await dbClient.deleteOrderStatusByUid(orderId2);
      await dbClient.deleteOrderByPatientUid(patientId2);
      await dbClient.deletePatientMapping(nhsNumber2, birthDate2);
      await dbClient.disconnect();
    },
  );
});
