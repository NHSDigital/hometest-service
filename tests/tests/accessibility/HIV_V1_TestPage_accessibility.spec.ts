import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('should pass accessibility check on Order Journey page', async ({ homeTestPage, accessibility }) => {
    await homeTestPage.navigate();

    // Wait for page to load
    expect(await homeTestPage.verifyPageLoaded()).toBe(true);
    await accessibility.runAccessibilityCheck(homeTestPage.page, "Get a self-test kit for HIV - NHS App prototype");
  });

});
