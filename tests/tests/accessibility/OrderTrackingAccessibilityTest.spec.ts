import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test - Confirmed Order Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('1');
    await orderTrackingPage.waitUntilPageLoad();
    await expect(orderTrackingPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "HIV self-test - Confirmed Order");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Dispatched Order Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('2');
    await orderTrackingPage.waitUntilPageLoad();
    await expect(orderTrackingPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "HIV self-test - Dispatched Order");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Test Received Order Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('3');
    await orderTrackingPage.waitUntilPageLoad();
    await expect(orderTrackingPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "HIV self-test - Test Received");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Your results is ready Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('4');
    await orderTrackingPage.waitUntilPageLoad();
    await expect(orderTrackingPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "HIV self-test - Your results is ready");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Error State Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('999');
    await orderTrackingPage.waitUntilPageLoad();

    await expect(orderTrackingPage.errorAlert.locator('h1')).toHaveText('There is a problem');

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "Error - There is a problem");
    expect(hasViolations).toBe(false);
  });

});
