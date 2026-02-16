import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Blood Sample Guide Page', async ({ homeTestStartPage, bloodSampleGuidePage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickBloodSampleGuideLink();
    // Wait for page to load
    await bloodSampleGuidePage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(bloodSampleGuidePage.page, "Blood Sample Guide Page");
    expect(accessErrors).toHaveLength(0)
  });
});
