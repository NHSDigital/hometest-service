import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Privacy Policy Page', async ({ homeTestStartPage, privacyPolicyPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickPrivacyPolicyLink();
    // Wait for page to load
    await privacyPolicyPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(privacyPolicyPage.page, "Privacy Policy Page");
    expect(accessErrors).toHaveLength(0);
  });
});
