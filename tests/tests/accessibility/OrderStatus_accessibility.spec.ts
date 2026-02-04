import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test - Confirmed Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('1');
    await orderStatusPage.waitUntilPageLoad();
    await expect(orderStatusPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "HIV self-test - Confirmed Order");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Dispatched Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('2');
    await orderStatusPage.waitUntilPageLoad();
    await expect(orderStatusPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "HIV self-test - Dispatched Order");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Test Received Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage .navigateToOrder('3');
    await orderStatusPage.waitUntilPageLoad();
    await expect(orderStatusPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "HIV self-test - Test Received");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Your results is ready Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('4');
    await orderStatusPage.waitUntilPageLoad();
    await expect(orderStatusPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderStatusPage, "HIV self-test - Your results is ready");
    expect(hasViolations).toBe(false);
  });

});
