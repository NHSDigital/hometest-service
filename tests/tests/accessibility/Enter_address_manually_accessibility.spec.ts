import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { EnterAddressManuallyPage } from '../../page-objects';

test.describe('Accessibility Testing @accessibility', () => {

  test('Enter Address Manually Page', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.clickEnterAddressManuallyLink();
    // Wait for page to load
    await findAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(enterAddressManuallyPage.page, "Enter Address Manually Page");
    expect(hasViolations).toBe(false);
  });
});
