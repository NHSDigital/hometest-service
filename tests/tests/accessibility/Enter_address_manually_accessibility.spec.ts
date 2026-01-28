import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Enter Address Manually Page', async ({ homeTestPage, findAddressPage, accessibility }) => {
    await homeTestPage.navigate();
    await homeTestPage.clickStartNowButton();
    await findAddressPage.clickEnterAddressManuallyLink();
    // Wait for page to load
    await findAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(findAddressPage.page, "Enter Address Manually Page");
    expect(hasViolations).toBe(false);
  });
});
