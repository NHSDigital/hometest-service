import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Order Status - Confirmed', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('1');
    await orderStatusPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "Order Status - Confirmed");
    expect(hasViolations).toBe(false);
  });

  test('Order Status - Dispatched', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('2');
    await orderStatusPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "Order Status - Dispatched");
    expect(hasViolations).toBe(false);
  });

  test('Order Status - Test Received', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('3');
    await orderStatusPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "Order Status - Test Received");
    expect(hasViolations).toBe(false);
  });

  test('Order Status - Result Ready', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('4');
    await orderStatusPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "Order Status - Result Ready");
    expect(hasViolations).toBe(false);
  });
});
