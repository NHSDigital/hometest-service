import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { TestOrderDbClient } from '../../db/TestOrderDbClient';
import { TestResultDbClient } from '../../db/TestResultDbClient';
import { randomUUID } from "crypto";

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();

test.describe('Accessibility Testing @accessibility', () => {
  test.beforeAll(async ({ testedUser }) => {
    await dbClient.connect();
    await resultDbClient.connect();
    console.log('Tested user:', JSON.stringify(testedUser, null, 2));
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(
        `Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`
      );
    }

    const result = await dbClient.createOrderWithPatientAndStatus({
      nhs_number: testedUser.nhsNumber,
      birth_date: testedUser.dob,
      supplier_name: 'Preventx',
      test_code: '31676001',
      initial_status: 'COMPLETE'
    });

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = randomUUID();

    await resultDbClient.insertStatusResult(
        orderId,
        "RESULT_AVAILABLE",
        correlationId,
      );
  });

 test(
   "Negative Result Page",
   {
     tag: ["@accessibility"],
   },
   async ({
     negativeResultPage,
     accessibility,
   }) => {
      await negativeResultPage.navigateToOrderResult(orderId);
      await negativeResultPage.waitForResultsToLoad();
     const accessErrors = await accessibility.runAccessibilityCheck(
       negativeResultPage.page,
       "Negative Result Page",
     );
     expect(accessErrors).toHaveLength(0);
   },
 );

  test.afterAll(async ({ testedUser }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(
        `Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`
      );
    }
    await resultDbClient.deleteResultStatusByUid(orderId);
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientByNHSandDOB(
      testedUser.nhsNumber,
      testedUser.dob
    );
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
