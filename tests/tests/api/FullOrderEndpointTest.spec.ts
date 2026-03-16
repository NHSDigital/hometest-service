import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import {
  headersOrder,
  headersTestResults,
  orderStatusPayload,
  buildHeaders,
} from "../../utils/ApiRequestHelper";
import { OrderStatusTestData } from "../../test-data/OrderStatusTypes";
import {
  createGetResultHeaders,
  createGetResultParams,
} from "../../test-data/GetResultRequestParams";
import { OrderTestData } from "../../test-data/OrderTestData";
import { CreateOrderResponseModel } from "../../models/CreateOrderResponse";
import { randomUUID } from "crypto";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();
const supplierId = OrderTestData.PREVENTX_SUPPLIER_ID;

test.describe("Full Order E2E API", { tag: ["@API"] }, () => {
  test.beforeAll("Connect to the database", async () => {
    await dbClient.connect();
    await resultDbClient.connect();
  });

  test.beforeEach("Create an order via API", async ({ testedUser, orderApi }) => {
    const payload = OrderTestData.getDefaultOrder();
    payload.patient.nhsNumber = testedUser.nhsNumber!;
    payload.patient.birthDate = testedUser.dob!;

    const orderResponse = await orderApi.createOrder(payload, headersOrder);
    expect(orderResponse.status()).toBe(201);

    const orderBody = CreateOrderResponseModel.fromJson(await orderResponse.json());

    orderId = orderBody.orderUid;
    correlationId = randomUUID();

    patientId = (await dbClient.getPatientUidByNhsNumber(testedUser.nhsNumber!))!;
    console.log(`Created order via API: ${orderId}, patientId: ${patientId}`);

    await expect
      .poll(async () => (await dbClient.getOrderStatusesByOrderUid(orderId))?.length, {
        timeout: 10000,
      })
      .toBe(3);
  });

  test("should set order status to COMPLETE and make result available when test result is normal", async ({
    hivResultsApi,
    orderApi,
    orderStatusApi,
    testedUser,
  }) => {
    const dispatchedResponse = await orderStatusApi.updateOrderStatus(
      orderStatusPayload(
        orderId,
        patientId,
        OrderStatusTestData.DEFAULT_STATUS,
        OrderStatusTestData.DEFAULT_INTENT,
        {
          businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_DISPATCHED },
        },
      ),
      buildHeaders(randomUUID()),
    );
    orderStatusApi.validateResponse(dispatchedResponse, 201);

    const { statusCode: dispatchedStatusCode } =
      await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId);
    expect(dispatchedStatusCode).toBe(OrderStatusTestData.EXPECTED_STATUS_CODE_DISPATCHED);
    expect(
      await dbClient.getOrderStatusCountByCode(
        orderId,
        OrderStatusTestData.EXPECTED_STATUS_CODE_DISPATCHED,
      ),
    ).toBe(1);

    const receivedResponse = await orderStatusApi.updateOrderStatus(
      orderStatusPayload(
        orderId,
        patientId,
        OrderStatusTestData.DEFAULT_STATUS,
        OrderStatusTestData.DEFAULT_INTENT,
        {
          businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB },
        },
      ),
      buildHeaders(randomUUID()),
    );
    orderStatusApi.validateResponse(receivedResponse, 201);

    const { statusCode: receivedStatusCode } =
      await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId);
    expect(receivedStatusCode).toBe(OrderStatusTestData.EXPECTED_STATUS_CODE_RECEIVED);
    expect(
      await dbClient.getOrderStatusCountByCode(
        orderId,
        OrderStatusTestData.EXPECTED_STATUS_CODE_RECEIVED,
      ),
    ).toBe(1);

    const testData = ResultsObservationData.buildNormalObservation(orderId, patientId, supplierId);
    const response = await hivResultsApi.submitTestResults(
      testData,
      headersTestResults(correlationId),
    );
    expect(response.status()).toBe(201);

    await orderApi.assertOrderHasStatus(
      testedUser.nhsNumber!,
      testedUser.dob!,
      orderId,
      "COMPLETE",
    );

    const resultResponse = await hivResultsApi.getResult(
      createGetResultParams(testedUser.nhsNumber!, testedUser.dob!, orderId),
      createGetResultHeaders(correlationId),
    );
    hivResultsApi.validateStatus(resultResponse, 200);
    const resultBody = await resultResponse.json();
    expect(resultBody.interpretation).toHaveLength(1);
    expect(resultBody.interpretation[0].coding[0].display).toBe("Normal");

    expect(await resultDbClient.getResultStatusCountByOrderUid(orderId)).toBe(1);
  });

  test("should set order status to RECEIVED and withhold result when test result is abnormal", async ({
    hivResultsApi,
    orderApi,
    orderStatusApi,
    testedUser,
  }) => {
    const dispatchedResponse = await orderStatusApi.updateOrderStatus(
      orderStatusPayload(
        orderId,
        patientId,
        OrderStatusTestData.DEFAULT_STATUS,
        OrderStatusTestData.DEFAULT_INTENT,
        {
          businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_DISPATCHED },
        },
      ),
      buildHeaders(randomUUID()),
    );
    orderStatusApi.validateResponse(dispatchedResponse, 201);

    const { statusCode: dispatchedStatusCode } =
      await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId);
    expect(dispatchedStatusCode).toBe(OrderStatusTestData.EXPECTED_STATUS_CODE_DISPATCHED);
    expect(
      await dbClient.getOrderStatusCountByCode(
        orderId,
        OrderStatusTestData.EXPECTED_STATUS_CODE_DISPATCHED,
      ),
    ).toBe(1);

    const receivedResponse = await orderStatusApi.updateOrderStatus(
      orderStatusPayload(
        orderId,
        patientId,
        OrderStatusTestData.DEFAULT_STATUS,
        OrderStatusTestData.DEFAULT_INTENT,
        {
          businessStatus: { text: OrderStatusTestData.BUSINESS_STATUS_RECEIVED_AT_LAB },
        },
      ),
      buildHeaders(randomUUID()),
    );
    orderStatusApi.validateResponse(receivedResponse, 201);

    const { statusCode: receivedStatusCode } =
      await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId);
    expect(receivedStatusCode).toBe(OrderStatusTestData.EXPECTED_STATUS_CODE_RECEIVED);
    expect(
      await dbClient.getOrderStatusCountByCode(
        orderId,
        OrderStatusTestData.EXPECTED_STATUS_CODE_RECEIVED,
      ),
    ).toBe(1);

    const testData = ResultsObservationData.buildAbnormalObservation(
      orderId,
      patientId,
      supplierId,
    );
    const response = await hivResultsApi.submitTestResults(
      testData,
      headersTestResults(correlationId),
    );
    expect(response.status()).toBe(201);

    await orderApi.assertOrderHasStatus(
      testedUser.nhsNumber!,
      testedUser.dob!,
      orderId,
      "RECEIVED",
    );

    expect(await resultDbClient.getResultStatusCountByOrderUid(orderId)).toBe(1);

    const resultResponse = await hivResultsApi.getResult(
      createGetResultParams(testedUser.nhsNumber!, testedUser.dob!, orderId),
      createGetResultHeaders(correlationId),
    );
    hivResultsApi.validateStatus(resultResponse, 404);
  });

  test.afterEach(
    "Delete result status, order status, order, and patient records from the database",
    async ({ testedUser }) => {
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteConsentByOrderUid(orderId);
      await dbClient.deleteOrderByUid(orderId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );

  test.afterAll("Disconnect from the database", async () => {
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
