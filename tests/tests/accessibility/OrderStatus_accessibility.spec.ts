import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';
import { type Result } from 'axe-core';
import { OrderStatus } from '../../test-data/orderStatus';

const accessErrors: Result[] = [];
test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test - Status Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder(OrderStatus.Confirmed);
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Confirmed", "Order Tracking Page"));

    await orderStatusPage.navigateToOrder(OrderStatus.Dispatched);
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Dispatched", "Order Tracking Page"));

    await orderStatusPage.navigateToOrder(OrderStatus.TestReceived);
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Test received", "Order Tracking Page"));

    await orderStatusPage.navigateToOrder(OrderStatus.ResultsReady);
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Result Ready", "Order Tracking Page"));

    expect(accessErrors).toHaveLength(0);
  });
});
