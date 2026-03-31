import { randomUUID } from "crypto";

import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";
import {
  createGetResultHeaders,
  createGetResultParams,
} from "../../test-data/GetResultRequestParams";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { createSupplierResultNotFoundMapping } from "../../utils/wireMockMappings/SupplierResultsWireMockMappings";

let orderId: string;
let patientId: string;
let correlationId: string;

test.describe("GET Result API", () => {
  test.beforeAll(
    "Connect to the database and create a patient, order, initial order status and result status",
    async ({ testedUser, testOrderDb, testResultDb }) => {
      const result = await testOrderDb.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(testedUser).withStatus("COMPLETE").build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;
      correlationId = randomUUID();

      await testResultDb.insertStatusResult(orderId, "RESULT_AVAILABLE", correlationId);
    },
  );

  test(
    "should retrieve the result and confirm the correct result status",
    { tag: ["@API"] },
    async ({ hivResultsApi, testedUser, testResultDb }) => {
      const params = createGetResultParams(testedUser.nhsNumber!, testedUser.dob!, orderId);
      const headers = createGetResultHeaders(correlationId);
      const response = await hivResultsApi.getResult(params, headers);

      hivResultsApi.validateStatus(response, 200);
      expect(await testResultDb.getResultStatusCountByOrderUid(orderId)).toBe(1);
      const responseBody = await response.json();
      const resultStatus = responseBody.interpretation[0].coding[0].display;
      expect(resultStatus).toBe("Normal");
      console.log("Confirmed status: Normal");
    },
  );

  test(
    "should return 500 when supplier responds with result not found",
    { tag: ["@API"] },
    async ({ hivResultsApi, testedUser, wiremock }) => {
      const resultNotFoundMapping = createSupplierResultNotFoundMapping(orderId);
      await wiremock.createMapping(resultNotFoundMapping);
      const params = createGetResultParams(testedUser.nhsNumber!, testedUser.dob!, orderId);
      const headers = createGetResultHeaders(randomUUID());
      const response = await hivResultsApi.getResult(params, headers);
      hivResultsApi.validateStatus(response, 500);
    },
  );

  test.afterAll(
    "Delete result status,order status, order, and patient records from the database and disconnect",
    async ({ testedUser, testOrderDb, testResultDb }) => {
      await testResultDb.deleteResultStatusByUid(orderId);
      await testOrderDb.deleteOrderStatusByUid(orderId);
      await testOrderDb.deleteConsentByPatientUid(patientId);
      await testOrderDb.deleteOrderByPatientUid(patientId);
      await testOrderDb.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
    },
  );
});
