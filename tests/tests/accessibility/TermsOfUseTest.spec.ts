import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { TermsOfUsePage } from '../../page-objects/TermsOfUsePage';

test(
  'Terms Of Usepage',
  {
    tag: ['@accessibility'],
  },
  async ({ homeTestStartPage, termsOfUsePage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickTermsOfUseLink();
    await termsOfUsePage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      termsOfUsePage.page,
      'Terms Of Use Page',
    );
    expect(accessErrors).toHaveLength(0);

  },
);
