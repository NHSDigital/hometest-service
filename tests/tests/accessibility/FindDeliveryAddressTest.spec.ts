import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';

test(
  'Find delivery address page',
  {
    tag: ['@accessibility']
  },
  async ({ homeTestStartPage, findAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      findAddressPage.page,
      'Find Delivery Address Page'
    );
    expect(accessErrors).toHaveLength(0);
  }
);
