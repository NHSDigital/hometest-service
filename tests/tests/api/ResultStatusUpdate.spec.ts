import { randomUUID } from "crypto";

import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { ResultsStatusData } from "../../test-data/ResultStatusData";
import { headersTestResults } from "../../utils";

let orderId: string;
let patientId: string;
const supplierName = "Preventx";
let supplierId: string;

test.describe("Results Flow - Update Order Results Logic", { tag: "@db" }, () => {
  test.beforeEach("Create a patient, order, order status", async ({ testedUser, testOrderDb }) => {
    const result = await testOrderDb.createOrderWithPatientAndStatus(
      new OrderBuilder()
        .withUser(testedUser)
        .withSupplier(supplierName)
        .withStatus("RECEIVED")
        .build(),
    );

    orderId = result.order_uid;
    patientId = result.patient_uid;
    console.log(`Created test order with ID: ${orderId}`);

    supplierId = await testOrderDb.getSupplierIdByName(supplierName);
  });

  test("Update result status to available", async ({
    hivResultsApi,
    testOrderDb,
    testResultDb,
  }) => {
    const testData = ResultsStatusData.resultsAvailable(orderId, patientId, supplierId);
    const response = await hivResultsApi.updateResultStatus(
      testData,
      headersTestResults(randomUUID()),
    );
    expect(response.status()).toBe(201);

    expect((await testOrderDb.getLatestOrderStatusWithCountByOrderUid(orderId)).statusCode).toEqual(
      "COMPLETE",
    );
    expect(await testResultDb.getLatestResultStatusByOrderUid(orderId)).toEqual("RESULT_AVAILABLE");
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
