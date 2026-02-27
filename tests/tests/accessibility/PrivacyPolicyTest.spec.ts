import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';

test(
  'Privacy policy page',
  {
    tag: ['@accessibility'],
  },
  async ({ homeTestStartPage, privacyPolicyPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickPrivacyPolicyLink();
    await privacyPolicyPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      privacyPolicyPage.page,
      'Privacy Policy Page',
    );
    expect(accessErrors).toHaveLength(0);
  },
);
