import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { headersTestResults } from "../../utils/ApiRequestHelper";
import { randomUUID } from "crypto";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();
const supplierName = "Preventx";
let supplierId: string;

test.describe("Results Flow - Update Order Results Logic", () => {
  test.beforeAll("Connect to the database", async () => {
    await dbClient.connect();
    await resultDbClient.connect();
  });

  test.beforeEach("Create a patient, order, initial order status", async ({ testedUser }) => {
    console.log("Tested user:", JSON.stringify(testedUser, null, 2));

    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).withSupplier(supplierName).build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = randomUUID();
    console.log(`Created test order with ID: ${orderId}`);

    supplierId = await dbClient.getSupplierIdByName(supplierName);
  });

  test("Update the order status and result status when test result is normal", async ({
    hivResultsApi,
  }) => {
    const testData = ResultsObservationData.buildNormalObservation(orderId, patientId, supplierId);
    const response = await hivResultsApi.submitTestResults(
      testData,
      headersTestResults(correlationId),
    );
    expect(response.status()).toBe(201);

    expect((await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId)).statusCode).toEqual(
      "COMPLETE",
    );
    expect(await resultDbClient.getLatestResultStatusByOrderUid(orderId)).toEqual(
      "RESULT_AVAILABLE",
    );
  });

  test("Update the result status when test result is abnormal", async ({ hivResultsApi }) => {
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

    expect((await dbClient.getLatestOrderStatusWithCountByOrderUid(orderId)).statusCode).toEqual(
      "RECEIVED",
    );
    expect(await resultDbClient.getLatestResultStatusByOrderUid(orderId)).toEqual(
      "RESULT_WITHHELD",
    );
  });

  test.afterEach(
    "Delete result status, order status, order, and patient records from the database",
    async ({ testedUser }) => {
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );

  test.afterAll("Disconnect from the database", async () => {
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
