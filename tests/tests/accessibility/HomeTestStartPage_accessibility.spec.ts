import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test Start Page Accessibility', async ({ homeTestStartPage, accessibility }) => {
    await homeTestStartPage.navigate();

    // Wait for page to load
    await homeTestStartPage.waitForPageLoaded();
    const hasViolations = await accessibility.runAccessibilityCheck(homeTestStartPage, "Home Test Start Page");
    expect(hasViolations).toBe(false);
  });

});
