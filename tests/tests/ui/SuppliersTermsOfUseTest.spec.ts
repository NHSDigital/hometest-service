import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

let orderId: string;
let patientId: string;
let orderId2: string;
const dbClient = new TestOrderDbClient();

test.describe("Suppliers Terms of Use Page", () => {
  test.beforeAll(
    "Connect to the database and create a patient and orders with different suppliers",
    async ({ testedUser }) => {
      await dbClient.connect();

      const result = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: testedUser.nhsNumber!,
        birth_date: testedUser.dob!,
        supplier_name: "Preventx",
        test_code: "PCR",
        initial_status: "DISPATCHED",
      });

      orderId = result.order_uid;
      patientId = result.patient_uid;

      const order2 = await dbClient.createOrderWithPatientAndStatus({
        nhs_number: testedUser.nhsNumber!,
        birth_date: testedUser.dob!,
        supplier_name: "SH:24",
        test_code: "PCR",
        initial_status: "RECEIVED",
      });

      orderId2 = order2.order_uid;
    },
  );

  const suppliers = [
    { name: "Preventx", orderId: () => orderId },
    { name: "SH:24", orderId: () => orderId2 },
  ];

  for (const supplier of suppliers) {
    test(`Open Supplier Terms and Conditions Page where the supplier is ${supplier.name}`, async ({
      suppliersTermsOfUsePage,
      orderStatusPage,
    }) => {
      await orderStatusPage.navigateToOrder(supplier.orderId());
      await orderStatusPage.clickSuppliersTermsOfUseLink();
      await suppliersTermsOfUsePage.waitUntilPageLoad();

      const header = await suppliersTermsOfUsePage.getHeaderText();
      console.log("Page header:", header);

      expect(header).toBe(`${supplier.name} terms of use`);
    });
  }

  test.afterAll(
    "Delete result status, order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
      await dbClient.disconnect();
    },
  );
});
