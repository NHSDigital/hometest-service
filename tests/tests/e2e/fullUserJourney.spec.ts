import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";

const randomAddress = AddressModel.getRandomAddress();
let testOrderDb: TestOrderDbClient;
let order_uid: string;
let patient_uid: string;

test.describe("Home test E2E tests", () => {
  test(
    "E2E - Full HIV Test user journey",
    { tag: ["@ui", "@e2e"] },
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
      orderSubmittedPage,
    }) => {
      await homeTestStartPage.navigate();
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await expect(homeTestStartPage.headerText).toHaveText(
        "This is what you'll need to do to give a blood sample",
      );
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
      await checkYourAnswersPage.checkConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
      await expect(orderSubmittedPage.headerText).toHaveText("Order submitted");
      const orderReference = await orderSubmittedPage.getOrderReference();
      expect(orderReference).toBeTruthy();
      testOrderDb = new TestOrderDbClient();
      testOrderDb.connect();
      const orderData = await testOrderDb.getOrderUidPatientUidByReferenceNumber(orderReference);
      order_uid = orderData.order_uid;
      patient_uid = orderData.patient_uid;
    },
  );

  test.afterEach(async () => {
    if (testOrderDb) {
      await testOrderDb.deleteConsentByOrderUid(order_uid);
      await testOrderDb.deleteOrderByUid(order_uid);
      await testOrderDb.deleteOrderByPatientUid(patient_uid);
      await testOrderDb.deletePatientMappingByPatientUid(patient_uid);
      testOrderDb.disconnect();
    }
  });
});
