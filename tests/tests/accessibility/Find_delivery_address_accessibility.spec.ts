import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Find Delivery Address Page', async ({ homeTestPage, findAddressPage, accessibility }) => {
    await homeTestPage.navigate();
    await homeTestPage.clickStartNowButton();

    // Wait for page to load
    await findAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(findAddressPage.page, "Find Delivery Address Page");
    expect(hasViolations).toBe(false);
  });
});