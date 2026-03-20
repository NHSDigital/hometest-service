import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { NHSLoginMockedUser } from "../../utils/users/BaseUser";

let orderId: string;
let patientId: string;
let orderId2: string;
let loggedInUser: NHSLoginMockedUser;
const dbClient = new TestOrderDbClient();

test.describe("Suppliers Privacy Policy Page", () => {
  test.beforeAll("Connect to the database ", async () => {
      await dbClient.connect();
    });
  test.beforeEach(
    "Connect to the database and create a patient and orders with different suppliers",
    async ({ loginUser, page }) => {

    const { user } = await loginUser(page);
    loggedInUser = user;
      const result = await dbClient.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(loggedInUser).build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;

      const order2 = await dbClient.createOrderWithPatientAndStatus(
        new OrderBuilder()
          .withUser(loggedInUser)
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

  test.afterEach(
    "Delete order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
       await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId2);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(loggedInUser.nhsNumber!, loggedInUser.dob!);
    },
  );
     test.afterAll("Close database connections", async () => {
        await dbClient.disconnect();
      });
});
