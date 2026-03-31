import { randomUUID } from "crypto";

import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import { headersTestResults } from "../../utils";

let orderId: string;
let patientId: string;
let correlationId: string;
const supplierName = "Preventx";
let supplierId: string;

test.describe("Results Flow - Update Order Results Logic", () => {
  test.beforeEach("Create a patient, order, order status", async ({ testedUser, testOrderDb }) => {
    console.log("Tested user:", JSON.stringify(testedUser, null, 2));

    const result = await testOrderDb.createOrderWithPatientAndStatus(
      new OrderBuilder()
        .withUser(testedUser)
        .withSupplier(supplierName)
        .withStatus("RECEIVED")
        .build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = randomUUID();
    console.log(`Created test order with ID: ${orderId}`);

    supplierId = await testOrderDb.getSupplierIdByName(supplierName);
  });

  test("Update the order status and result status when test result is normal", async ({
    hivResultsApi,
    testOrderDb,
    testResultDb,
  }) => {
    const testData = ResultsObservationData.buildNormalObservation(orderId, patientId, supplierId);
    const response = await hivResultsApi.submitTestResults(
      testData,
      headersTestResults(correlationId),
    );
    expect(response.status()).toBe(201);

    expect((await testOrderDb.getLatestOrderStatusWithCountByOrderUid(orderId)).statusCode).toEqual(
      "COMPLETE",
    );
    expect(await testResultDb.getLatestResultStatusByOrderUid(orderId)).toEqual("RESULT_AVAILABLE");
  });

  test("Update the result status when test result is abnormal", async ({
    hivResultsApi,
    testOrderDb,
    testResultDb,
  }) => {
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

    expect((await testOrderDb.getLatestOrderStatusWithCountByOrderUid(orderId)).statusCode).toEqual(
      "RECEIVED",
    );
    expect(await testResultDb.getLatestResultStatusByOrderUid(orderId)).toEqual("RESULT_WITHHELD");
  });

  test.afterEach(
    "Delete result status, order status, order, and patient records from the database",
    async ({ testedUser, testOrderDb, testResultDb }) => {
      await testResultDb.deleteResultStatusByUid(orderId);
      await testOrderDb.deleteOrderStatusByUid(orderId);
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderByPatientUid(patientId);
      await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );
});
