import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Find Address Page', async ({ homeTestStartPage, findAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue('SW1A 1AA', 'Buckingham Palace');
    await findAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(findAddressPage.page, "Find Address Page");
    expect(hasViolations).toBe(false);
  });
});
