import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { NHSEmailAndPasswordPage } from "../../page-objects/NHSLogin/NHSEmailAndPasswordPage";
import { randomUUID } from "crypto";

let orderId: string;
let patientId: string;
let orderId2: string;
let patientId2: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();

test.describe("Results Page", () => {
  test.beforeAll(
    "Connect to the database and create a patient, order, initial order status and result status",
    async ({ testedUser }) => {
      await dbClient.connect();
      await resultDbClient.connect();

      const result = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: testedUser.nhsNumber!,
        birth_date: testedUser.dob!,
        supplier_name: "Preventx",
        test_code: "PCR",
        initial_status: "COMPLETE",
      });

      const resultSecondPatient = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: "9876543211",
        birth_date: "1990-01-01",
        supplier_name: "Preventx",
        test_code: "PCR",
        initial_status: "COMPLETE",
      });

      orderId = result.order_uid;
      patientId = result.patient_uid;
      console.log(`Created test order with ID: ${orderId}`);

      orderId2 = resultSecondPatient.order_uid;
      patientId2 = resultSecondPatient.patient_uid;

      const correlationId = randomUUID();
      const correlationId2 = randomUUID();

      await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", correlationId);
      await resultDbClient.insertStatusResult(orderId2, "RESULT_AVAILABLE", correlationId2);
    },
  );

  test("Authenticated user opens a deep link", async ({ negativeResultPage }) => {
    await negativeResultPage.navigateToOrderResult(orderId);
    await expect(negativeResultPage.result).toHaveText("Negative");
  });

  test.describe("Unauthorized access", () => {
    test.use({
      errorCaptureOptions: {
        failOnConsoleError: false,
        failOnNetworkError: false,
      },
    });

    test("Unauthorized user opens a deep link", async ({ negativeResultPage, orderStatusPage }) => {
      await negativeResultPage.navigateToOrderResult(orderId2);
      await orderStatusPage.orderNotFoundMessage.waitFor({ state: "visible" });
      const url = await negativeResultPage.getCurrentUrl();
      expect(url).toContain("/tracking");
    });

    test("Unauthenticated user opens a deep link", async ({ negativeResultPage }) => {
      const context = negativeResultPage.page.context();
      await context.clearCookies();
      await context.clearPermissions();
      await negativeResultPage.navigateToOrderResult(orderId);
      const nhsLogin = new NHSEmailAndPasswordPage(negativeResultPage.page);
      await expect(nhsLogin.emailInput).toBeVisible();
    });
  });

  test.afterAll(
    "Delete result status,order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
      await resultDbClient.deleteResultStatusByUid(orderId2);
      await dbClient.deleteOrderStatusByUid(orderId2);
      await dbClient.deleteOrderByPatientUid(patientId2);
      await dbClient.deletePatientMapping("9876543211", "1990-01-01");
      await dbClient.disconnect();
      await resultDbClient.disconnect();
    },
  );
});
