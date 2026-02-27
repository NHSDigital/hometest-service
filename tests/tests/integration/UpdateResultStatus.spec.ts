import { expect } from '@playwright/test';
import { test } from "../../fixtures/CombinedTestFixture";
import { TestOrderDbClient } from '../../db/TestOrderDbClient';
import { ResultsObservationData } from '../../test-data/ResultsObservationData';
import { TestResultDbClient } from '../../db/TestResultDbClient';
import { createGetResultHeaders } from '../../test-data/GetResultRequestParams';

let orderId: string;
let patientId: string;
let correlationId: string;
const dbClient = new TestOrderDbClient();
const resultDbClient = new TestResultDbClient();
const supplierName = 'Preventx';
let supplierId: string;

test.describe('Results Flow - Update Order Results Logic', () => {

  test.beforeAll('Connect to the database', async () => {
    await dbClient.connect();
    await resultDbClient.connect();
  });


  test.beforeEach('Create a patient, order, initial order status', async ({ testedUser }) => {
    console.log('Tested user:', JSON.stringify(testedUser, null, 2));

    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(`Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`);
    }

    const result = await dbClient.createOrderWithPatientAndStatus({
      nhs_number: testedUser.nhsNumber,
      birth_date: testedUser.dob,
      supplier_name: supplierName,
      test_code: 'PCR',
      initial_status: 'ORDER_RECEIVED',
    });

    orderId = result.order_uid;
    patientId = result.patient_uid;
    correlationId = result.correlation_id;
    console.log(`Created test order with ID: ${orderId}`);

    supplierId = await dbClient.getSupplierIdByName(supplierName);
  });

  test('Update the order status and result status when test result is normal', async ({ testedUser, hivResultsApi }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error('Test user must have nhsNumber and dob');
    }

    const testData = ResultsObservationData.buildNormalObservation(orderId, patientId, supplierId);
    const headers = createGetResultHeaders(correlationId);
    const response = await hivResultsApi.submitTestResults(testData, headers);
    hivResultsApi.validateStatus(response, 201);

    expect(await dbClient.getLatestOrderStatusByOrderUid(orderId)).toEqual('COMPLETE');
    expect(await resultDbClient.getLatestResultStatusByOrderUid(orderId)).toEqual('RESULT_AVAILABLE');
  });

  test('Update the result status when test result is abnormal', async ({ testedUser, hivResultsApi }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error('Test user must have nhsNumber and dob');
    }

    const testData = ResultsObservationData.buildAbnormalObservation(orderId, patientId, supplierId);
    const headers = createGetResultHeaders(correlationId);
    const response = await hivResultsApi.submitTestResults(testData, headers);
    hivResultsApi.validateStatus(response, 201);

    expect(await dbClient.getLatestOrderStatusByOrderUid(orderId)).toEqual('RECEIVED');
    expect(await resultDbClient.getLatestResultStatusByOrderUid(orderId)).toEqual('RESULT_WITHHELD');
  });

  test.afterEach(
    "Delete result status,order status, order, and patient records from the database and disconnect",
    async ({ testedUser }) => {
      if (!testedUser.nhsNumber || !testedUser.dob) {
        throw new Error(
          `Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`,
        );
      }
      await resultDbClient.deleteResultStatusByUid(orderId);
      await dbClient.deleteOrderStatusByUid(orderId);
      await dbClient.deleteOrderByPatientUid(patientId);
      await dbClient.deletePatientByNHSandDOB(
        testedUser.nhsNumber,
        testedUser.dob,
      );
    },
  );

  test.afterAll('Disconnect from the database', async () => {
    await dbClient.disconnect();
    await resultDbClient.disconnect();
  });
});
