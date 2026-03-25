import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { buildHeaders, headersTestResults, orderStatusPayload } from "../../utils/ApiRequestHelper";
import { OrderStatusTestData } from "../../test-data/OrderStatusTypes";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import { randomUUID } from "crypto";
import { TestResultDbClient } from "../../db/TestResultDbClient";

const randomAddress = AddressModel.getRandomAddress();
const dbClient = new TestOrderDbClient();
const resultsDbClient = new TestResultDbClient();

test.describe("Home test E2E tests", () => {
  test.beforeAll(async () => {
    await dbClient.connect();
    await resultsDbClient.connect();
  });

  test.afterEach(async ({ testedUser }) => {
    const patientId = await dbClient.getPatientUidByNhsNumber(testedUser.nhsNumber!);
    const order = await dbClient.getOrderByPatientUid(patientId!);
    if (order) {
      await resultsDbClient.deleteResultStatusByUid(order.order_uid);
    }
    if (patientId) {
      await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderStatusByPatientUid(patientId);
      await dbClient.deleteOrderStatusByPatientUid(patientId);
      await dbClient.deleteOrderByPatientUid(patientId);

    }
    await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
  });

  test.afterAll(async () => {
    await dbClient.disconnect();
    await resultsDbClient.disconnect();
  });

  test(
    "E2E - Full HIV Test user journey",
    { tag: ["@ui", "@e2e"] },
    async ({
      testedUser,
      orderStatusApi,
      hivResultsApi,
      negativeResultPage,
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
      orderSubmittedPage,
      orderStatusPage
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


      const patientId = await dbClient.getPatientUidByNhsNumber(testedUser.nhsNumber!);
      const order = await dbClient.getOrderByPatientUid(patientId!);
      await expect
        .poll(() => dbClient.hasOrderStatusCode(order!.order_uid, "SUBMITTED"), { timeout: 10000 })
        .toBe(true);

      const dispatchedResponse = await orderStatusApi.updateOrderStatus(
        orderStatusPayload(
          order!.order_uid,
          patientId!,
          OrderStatusTestData.DEFAULT_STATUS,
          OrderStatusTestData.DEFAULT_INTENT,
          { businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_DISPATCHED } },
        ),
        buildHeaders(randomUUID()),
      );
      orderStatusApi.validateResponse(dispatchedResponse, 201);

      await orderStatusPage.navigateToOrder(order!.order_uid);
      await expect(orderStatusPage.statusTag).toHaveText("Dispatched");

      const receivedResponse = await orderStatusApi.updateOrderStatus(
        orderStatusPayload(
          order!.order_uid,
          patientId!,
          OrderStatusTestData.DEFAULT_STATUS,
          OrderStatusTestData.DEFAULT_INTENT,
          { businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB } },
        ),
        buildHeaders(randomUUID()),
      );
      orderStatusApi.validateResponse(receivedResponse, 201);

      await orderStatusPage.navigateToOrder(order!.order_uid);
      await expect(orderStatusPage.statusTag).toHaveText("Test received");

      const resultsResponse = await hivResultsApi.submitTestResults(
        ResultsObservationData.buildNormalObservation(
          order!.order_uid,
          patientId!,
          order!.supplier_id,
        ),
        headersTestResults(randomUUID()),
      );
      expect(resultsResponse.status()).toBe(201);

      await negativeResultPage.navigateToOrderResult(order!.order_uid);
      await expect(negativeResultPage.pageHeader).toHaveText("HIV self-test result");
      await expect(negativeResultPage.result).toHaveText("Negative");
    },
  );

  test(
    "E2E - Full HIV Test user journey - abnormal result",
    { tag: ["@ui", "@e2e"] },
    async ({
      testedUser,
      orderStatusApi,
      hivResultsApi,
      negativeResultPage,
      orderStatusPage,
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

      const patientId = await dbClient.getPatientUidByNhsNumber(testedUser.nhsNumber!);
      const order = await dbClient.getOrderByPatientUid(patientId!);
      await expect
        .poll(() => dbClient.hasOrderStatusCode(order!.order_uid, "SUBMITTED"), { timeout: 10000 })
        .toBe(true);

      const dispatchedResponse = await orderStatusApi.updateOrderStatus(
        orderStatusPayload(
          order!.order_uid,
          patientId!,
          OrderStatusTestData.DEFAULT_STATUS,
          OrderStatusTestData.DEFAULT_INTENT,
          { businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_DISPATCHED } },
        ),
        buildHeaders(randomUUID()),
      );
      orderStatusApi.validateResponse(dispatchedResponse, 201);

      await orderStatusPage.navigateToOrder(order!.order_uid);
      await expect(orderStatusPage.statusTag).toHaveText("Dispatched");

      const receivedResponse = await orderStatusApi.updateOrderStatus(
        orderStatusPayload(
          order!.order_uid,
          patientId!,
          OrderStatusTestData.DEFAULT_STATUS,
          OrderStatusTestData.DEFAULT_INTENT,
          { businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB } },
        ),
        buildHeaders(randomUUID()),
      );
      orderStatusApi.validateResponse(receivedResponse, 201);

      await orderStatusPage.navigateToOrder(order!.order_uid);
      await expect(orderStatusPage.statusTag).toHaveText("Test received");

      const resultsResponse = await hivResultsApi.submitTestResults(
        ResultsObservationData.buildAbnormalObservation(
          order!.order_uid,
          patientId!,
          order!.supplier_id,
        ),
        headersTestResults(randomUUID()),
      );
      expect(resultsResponse.status()).toBe(201);

      await negativeResultPage.navigateToOrderResultExpectingPath(
        order!.order_uid,
        orderStatusPage.statusTag,
        `/orders/${order!.order_uid}/tracking`,
      );
      await expect(orderStatusPage.statusTag).toHaveText("Test received");
    },
  );
});
