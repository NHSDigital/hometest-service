import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { type Result } from 'axe-core';
import { TestOrderDbClient } from '../../db/TestOrderDbClient';

let orderId: string;
let patientId: string
const dbClient = new TestOrderDbClient();
const accessErrors: Result[] = [];
test.describe('Accessibility Testing @accessibility', () => {
  test.beforeAll(async ({ testedUser }) => {
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
  });

  test('Home Test - Status Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder(orderId);
    await orderStatusPage.waitForOrderToLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Confirmed", "Order Tracking Page"));

    await dbClient.updateOrderStatus(orderId, 'DISPATCHED');

    await orderStatusPage.navigateToOrder(orderId);
    await orderStatusPage.waitForOrderToLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Dispatched", "Order Tracking Page"));

    await dbClient.updateOrderStatus(orderId, 'RECEIVED');

    await orderStatusPage.navigateToOrder(orderId);
    await orderStatusPage.waitForOrderToLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Test received", "Order Tracking Page"));

    await dbClient.updateOrderStatus(orderId, 'COMPLETE');
    await orderStatusPage.navigateToOrder(orderId);
    await orderStatusPage.waitForOrderToLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Result Ready", "Order Tracking Page"));

    expect(accessErrors).toHaveLength(0);
  });

  test.afterAll(async ({ testedUser }) => {
    if (!testedUser.nhsNumber || !testedUser.dob) {
      throw new Error(`Tested user is missing nhsNumber or dob. User: ${JSON.stringify(testedUser)}`);
    }
    await dbClient.deleteOrderStatusByUid(orderId);
    await dbClient.deleteOrderByPatientUid(patientId);
    await dbClient.deletePatientByNHSandDOB(testedUser.nhsNumber, testedUser.dob);
    await dbClient.disconnect();
    });
});
