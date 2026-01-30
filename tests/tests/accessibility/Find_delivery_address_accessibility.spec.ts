import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Find Delivery Address Page', async ({ homeTestStartPage, findAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();

    // Wait for page to load
    await findAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(findAddressPage.page, "Find Delivery Address Page");
    expect(hasViolations).toBe(false);
  });
});
