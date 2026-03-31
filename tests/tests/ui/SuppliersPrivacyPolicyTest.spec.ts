import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let orderId2: string;

test.describe("Suppliers Privacy Policy Page", () => {
  test.beforeAll(
    "Connect to the database and create a patient and orders with different suppliers",
    async ({ testedUser, testOrderDb }) => {
      const result = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(testedUser).build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;

      const order2 = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder()
          .withUser(testedUser)
          .withStatus("RECEIVED")
          .withSupplier("SH:24")
          .build(),
      );

      orderId2 = order2.order_uid;
    },
  );

  const suppliers = [
    { name: "Preventx", orderId: () => orderId },
    { name: "SH:24", orderId: () => orderId2 },
  ];

  for (const supplier of suppliers) {
    test(`Open Supplier Privacy Policy Page where the supplier is ${supplier.name}`, async ({
      suppliersPrivacyPolicyPage,
      orderStatusPage,
    }) => {
      await orderStatusPage.navigateToOrder(supplier.orderId());
      await orderStatusPage.clickSuppliersPrivacyPolicyLink();
      const header = await suppliersPrivacyPolicyPage.getHeaderText();
      expect(header).toBe(`${supplier.name} privacy policy`);
    });
  }

  test.afterAll(
    "Delete order status, order, and patient records from the database and disconnect",
    async ({ testedUser, testOrderDb }) => {
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderStatusByUid(orderId);
      await testOrderDb.deleteOrderStatusByUid(orderId2);
      await testOrderDb.deleteOrderByPatientUid(patientId);
      await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );
});
