import { randomUUID } from "crypto";

import { APIResponse, expect } from "@playwright/test";

import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { test } from "../../fixtures/CombinedTestFixture";
import { AddressModel } from "../../models/Address";
import { OrderStatusTestData } from "../../test-data/OrderStatusTypes";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import { buildHeaders, headersTestResults, orderStatusPayload } from "../../utils/ApiRequestHelper";

const randomAddress = AddressModel.getRandomAddress();
const dbClient = new TestOrderDbClient();
const resultsDbClient = new TestResultDbClient();

const EXPECTED_TEXTS = {
  HIV_KIT_HEADER: "Get a self-test kit for HIV",
  BLOOD_SAMPLE_HEADER: "This is what you'll need to do to give a blood sample",
  ORDER_SUBMITTED: "Order submitted",
  DISPATCHED: "Dispatched",
  TEST_RECEIVED: "Test received",
  HIV_RESULT_HEADER: "HIV self-test result",
  NEGATIVE_RESULT: "Negative",
} as const;

const ORDER_STATUS_POLL_TIMEOUT = 10000;

interface OrderData {
  orderId: string;
  patientId: string;
  supplierId: string;
}

test.describe("Home test E2E tests", () => {
  test.beforeAll(async () => {
    await dbClient.connect();
    await resultsDbClient.connect();
  });

  async function completeOrderJourney(context: {
    homeTestStartPage: any;
    enterDeliveryAddressPage: any;
    selectDeliveryAddressPage: any;
    howComfortablePrickingFingerPage: any;
    confirmMobileNumberPage: any;
    checkYourAnswersPage: any;
    orderSubmittedPage: any;
  }): Promise<void> {
    await context.homeTestStartPage.navigate();
    await expect(context.homeTestStartPage.headerText).toHaveText(EXPECTED_TEXTS.HIV_KIT_HEADER);
    await context.homeTestStartPage.clickStartNowButton();
    await context.enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await context.selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(context.homeTestStartPage.headerText).toHaveText(
      EXPECTED_TEXTS.BLOOD_SAMPLE_HEADER,
    );
    await context.howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await context.confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    await context.checkYourAnswersPage.checkConsentCheckbox();
    await context.checkYourAnswersPage.clickSubmitOrder();
    await expect(context.orderSubmittedPage.headerText).toHaveText(EXPECTED_TEXTS.ORDER_SUBMITTED);
  }

  async function getOrderData(nhsNumber: string): Promise<OrderData> {
    const patientId = await dbClient.getPatientUidByNhsNumber(nhsNumber);
    const order = await dbClient.getOrderByPatientUid(patientId!);

    await expect
      .poll(() => dbClient.hasOrderStatusCode(order!.order_uid, "SUBMITTED"), {
        timeout: ORDER_STATUS_POLL_TIMEOUT,
      })
      .toBe(true);

    return {
      orderId: order!.order_uid,
      patientId: patientId!,
      supplierId: order!.supplier_id,
    };
  }

  async function updateOrderStatusAndVerify(
    orderStatusApi: any,
    orderStatusPage: any,
    orderData: OrderData,
    businessStatusText: string,
    expectedDisplayStatus: string,
  ): Promise<void> {
    const response = await orderStatusApi.updateOrderStatus(
      orderStatusPayload(
        orderData.orderId,
        orderData.patientId,
        OrderStatusTestData.DEFAULT_STATUS,
        OrderStatusTestData.DEFAULT_INTENT,
        { businessStatus: { text: businessStatusText } },
      ),
      buildHeaders(randomUUID()),
    );
    orderStatusApi.validateResponse(response, 201);

    await orderStatusPage.navigateToOrder(orderData.orderId);
    await expect(orderStatusPage.statusTag).toHaveText(expectedDisplayStatus);
  }

  async function submitTestResults(
    hivResultsApi: any,
    orderData: OrderData,
    isNormal: boolean,
  ): Promise<APIResponse> {
    const observation = isNormal
      ? ResultsObservationData.buildNormalObservation(
          orderData.orderId,
          orderData.patientId,
          orderData.supplierId,
        )
      : ResultsObservationData.buildAbnormalObservation(
          orderData.orderId,
          orderData.patientId,
          orderData.supplierId,
        );

    return await hivResultsApi.submitTestResults(observation, headersTestResults(randomUUID()));
  }

  test.afterEach(async ({ testedUser }) => {
    const patientId = await dbClient.getPatientUidByNhsNumber(testedUser.nhsNumber!);
    const order = await dbClient.getOrderByPatientUid(patientId!);
    if (order) {
      await resultsDbClient.deleteResultStatusByUid(order.order_uid);
    }
    if (patientId) {
      await dbClient.deleteConsentByPatientUid(patientId);
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
    "E2E - Full HIV Test user journey - normal result",
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
      orderStatusPage,
    }) => {
      await completeOrderJourney({
        homeTestStartPage,
        enterDeliveryAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        confirmMobileNumberPage,
        checkYourAnswersPage,
        orderSubmittedPage,
      });

      const orderData = await getOrderData(testedUser.nhsNumber!);

      await updateOrderStatusAndVerify(
        orderStatusApi,
        orderStatusPage,
        orderData,
        OrderStatusTestData.BUSINESS_STATUS_DISPATCHED,
        EXPECTED_TEXTS.DISPATCHED,
      );

      await updateOrderStatusAndVerify(
        orderStatusApi,
        orderStatusPage,
        orderData,
        OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB,
        EXPECTED_TEXTS.TEST_RECEIVED,
      );

      const resultsResponse = await submitTestResults(hivResultsApi, orderData, true);
      expect(resultsResponse.status()).toBe(201);

      await negativeResultPage.navigateToOrderResult(orderData.orderId);
      await expect(negativeResultPage.pageHeader).toHaveText(EXPECTED_TEXTS.HIV_RESULT_HEADER);
      await expect(negativeResultPage.result).toHaveText(EXPECTED_TEXTS.NEGATIVE_RESULT);
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
      await completeOrderJourney({
        homeTestStartPage,
        enterDeliveryAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        confirmMobileNumberPage,
        checkYourAnswersPage,
        orderSubmittedPage,
      });

      const orderData = await getOrderData(testedUser.nhsNumber!);

      await updateOrderStatusAndVerify(
        orderStatusApi,
        orderStatusPage,
        orderData,
        OrderStatusTestData.BUSINESS_STATUS_DISPATCHED,
        EXPECTED_TEXTS.DISPATCHED,
      );

      await updateOrderStatusAndVerify(
        orderStatusApi,
        orderStatusPage,
        orderData,
        OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB,
        EXPECTED_TEXTS.TEST_RECEIVED,
      );

      const resultsResponse = await submitTestResults(hivResultsApi, orderData, false);
      expect(resultsResponse.status()).toBe(201);

      await negativeResultPage.navigateToOrderResultExpectingPath(
        orderData.orderId,
        orderStatusPage.statusTag,
        `/orders/${orderData.orderId}/tracking`,
      );
      await expect(orderStatusPage.statusTag).toHaveText(EXPECTED_TEXTS.TEST_RECEIVED);
    },
  );
});
