import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test - Confirmed Order Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('1');
    await expect(orderTrackingPage.orderHeading).toBeVisible();

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "HIV self-test - Confirmed Order");
    expect(hasViolations).toBe(false);
  });

  test('Home Test - Error State Accessibility', async ({ orderTrackingPage, accessibility }) => {
    await orderTrackingPage.navigateToOrder('999');

    await expect(orderTrackingPage.errorAlert.locator('h1')).toHaveText('There is a problem');

    const hasViolations = await accessibility.runAccessibilityCheck(orderTrackingPage, "Error - There is a problem");
    expect(hasViolations).toBe(false);
  });

});
