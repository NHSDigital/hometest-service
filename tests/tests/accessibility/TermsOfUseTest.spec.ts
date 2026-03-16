import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
test(
  'Terms Of Use Page',
  {
    tag: ['@accessibility'],
  },
  async ({ homeTestStartPage, termsOfUsePage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickTermsOfUseLink();
    await termsOfUsePage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      termsOfUsePage.page,
      'Terms Of Use Page',
    );
    expect(accessErrors).toHaveLength(0);
  },
);
