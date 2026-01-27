import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('should pass accessibility check on Enter Delivery Address page', async ({ homeTestPage, accessibility }) => {
    await homeTestPage.navigate();
    await homeTestPage.clickStartNowButton();

    // Wait for page to load
    expect(await homeTestPage.verifyPageLoaded()).toBe(true);
    await accessibility.runAccessibilityCheck(homeTestPage.page, "NHS HIV Home Test Service - Find Delivery Address Page");
  });

});
