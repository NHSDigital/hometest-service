import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Enter Address Manually Page', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(enterAddressManuallyPage.page, "Enter Address Manually Page");
    expect(accessErrors).toHaveLength(0);
  });
});
