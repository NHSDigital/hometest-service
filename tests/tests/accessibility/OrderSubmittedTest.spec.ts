import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";

const randomAddress = AddressModel.getRandomAddress();
let testOrderDb: TestOrderDbClient; // fixed: was `estOrderDb`
let order_uid: string;
let patient_uid: string;

// ...existing code...

test(
  "Order Submitted page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
    orderSubmittedPage,
    accessibility,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    await checkYourAnswersPage.checkConsentCheckbox();
    await checkYourAnswersPage.clickSubmitOrder();
    await orderSubmittedPage.waitUntilPageLoad();

    const accessErrors = await accessibility.runAccessibilityCheck(
      orderSubmittedPage.page,
      "Order Submitted Page",
    );
    expect(accessErrors).toHaveLength(0);

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