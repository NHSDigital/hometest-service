import {
  createGetResultHeaders,
  createGetResultParams,
} from "../../test-data/GetResultRequestParams";

import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { TestResultDbClient } from "../../db/TestResultDbClient";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { randomUUID } from "crypto";
import { OrderBuilder } from "../../test-data/OrderBuilder";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();

test.describe("GET Result API @api", () => {
  test.beforeAll(
    "Connect to the database and create a patient, order, initial order status and result status",
    async ({ testedUser }) => {
      await dbClient.connect();
      await resultDbClient.connect();
      // testedUser.nhsNumber and testedUser.dob are validated in the global fixture

      const result = await dbClient.createOrderWithPatientAndStatus(
        new OrderBuilder().withUser(testedUser).withStatus("COMPLETE").build(),
      );

      orderId = result.order_uid;
      patientId = result.patient_uid;
      correlationId = randomUUID();
      console.log(`Created test order with ID: ${orderId}`);

      await resultDbClient.insertStatusResult(orderId, "RESULT_AVAILABLE", correlationId);
    },
  );

  test("should retrieve the result and confirm the correct result status", async ({
    hivResultsApi,
    testedUser,
  }) => {
    const params = createGetResultParams(testedUser.nhsNumber!, testedUser.dob!, orderId);
    const headers = createGetResultHeaders(correlationId);
    const response = await hivResultsApi.getResult(params, headers);

    hivResultsApi.validateStatus(response, 200);
    const responseBody = await response.json();
    console.log("The response received: " + JSON.stringify(responseBody, null, 2));
    const resultStatus = responseBody.interpretation[0].coding[0].display;
    expect(resultStatus).toBe("Normal");
    console.log("Confirmed status: Normal");
  });

  test.afterAll(
    "Delete result status,order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteConsentByPatientUid(patientId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientMapping(testedUser.nhsNumber!, testedUser.dob!);
      await dbClient.disconnect();
      await resultDbClient.disconnect();
    },
  );
});
