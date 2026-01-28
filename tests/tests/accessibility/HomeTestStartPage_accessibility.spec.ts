import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test Start Page Accessibility', async ({ homeTestStartPage, accessibility }) => {
    await homeTestStartPage.navigate();

    // Wait for page to load
    expect(await homeTestStartPage.verifyPageLoaded()).toBe(true);
    await accessibility.runAccessibilityCheck(homeTestStartPage, "Get a self-test kit for HIV");
  });

});
