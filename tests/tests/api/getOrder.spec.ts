import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { TestOrderDbClient } from '../../db/TestOrderDbClient';

let orderId: string;
let patientId: string;
const dbClient = new TestOrderDbClient();

test.describe('GET Order API @api', () => {
  test.beforeAll('Connect to the database and create a patient, order, and initial order status', async ({ testedUser }) => {
    await dbClient.connect();
    console.log('Tested user:', JSON.stringify(testedUser, null, 2));

    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(`Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`);
    }

    const result = await dbClient.createOrderWithPatientAndStatus({
      nhs_number: testedUser.nhsNumber,
      birth_date: testedUser.dob,
      supplier_name: 'Preventx',
      test_code: 'PCR',
      initial_status: 'ORDER_RECEIVED',
    });

    orderId = result.order_uid;
    patientId = result.patient_uid;
    console.log(`Created test order with ID: ${orderId}`);
  });

  test('should retrieve order and confirm status changes', async ({ orderApi, testedUser }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error('Test user must have nhsNumber and dob');
    }

    // Make GET request for ORDER_RECEIVED status
    let response = await orderApi.getOrder(
      testedUser.nhsNumber,
      testedUser.dob,
      orderId
    );


    orderApi.validateResponse(response, 200);
    let responseBody = await response.json();
    console.log('The response received: ' + JSON.stringify(responseBody, null, 2));
    let OrderStatus = responseBody.entry[0].resource.extension[0]
      .valueCodeableConcept
      .coding[0]
      .code;
    expect(OrderStatus).toBe('ORDER_RECEIVED');
    console.log('Confirmed status: ORDER_RECEIVED');

    // Update the status to DISPATCHED
    await dbClient.updateOrderStatus(orderId, 'DISPATCHED');

    // Make GET request again
    response = await orderApi.getOrder(
      testedUser.nhsNumber,
      testedUser.dob,
      orderId
    );

    // Confirm the status is DISPATCHED
    orderApi.validateResponse(response, 200);
    responseBody = await response.json();
    OrderStatus = responseBody.entry[0].resource.extension[0]
    .valueCodeableConcept
      .coding[0]
      .code;
    expect(OrderStatus).toBe('DISPATCHED');
    console.log('Confirmed status: DISPATCHED');

    // Update the status to RECEIVED
    await dbClient.updateOrderStatus(orderId, 'RECEIVED');

    // Make GET request again
    response = await orderApi.getOrder(
      testedUser.nhsNumber,
      testedUser.dob,
      orderId
    );

    // Confirm the status is RECEIVED
    orderApi.validateResponse(response, 200);
    responseBody = await response.json();
    OrderStatus = responseBody.entry[0].resource.extension[0]
      .valueCodeableConcept
      .coding[0]
      .code;
    expect(OrderStatus).toBe('RECEIVED');
    console.log('Confirmed status: RECEIVED');

    // Update the status to COMPLETE
    await dbClient.updateOrderStatus(orderId, 'COMPLETE');

    // Make GET request again
    response = await orderApi.getOrder(
      testedUser.nhsNumber,
      testedUser.dob,
      orderId
    );

    // Confirm the status is COMPLETE
    orderApi.validateResponse(response, 200);
    responseBody = await response.json();
    OrderStatus = responseBody.entry[0].resource.extension[0]
      .valueCodeableConcept
      .coding[0]
      .code;
    expect(OrderStatus).toBe('COMPLETE');
    console.log('Confirmed status: COMPLETE');
  });

  test.afterAll('Delete result status,order status, order, and patient records from the database and disconnect',async ({ testedUser }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(`Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`);
    }
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientByNHSandDOB(testedUser.nhsNumber, testedUser.dob);
    await dbClient.disconnect();
  });
});
