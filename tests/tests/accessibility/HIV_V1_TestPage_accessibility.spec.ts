import { expect } from '@playwright/test';
import { test } from '../../fixtures';

test.describe('Accessibility Testing @accessibility', () => {

  test('should pass accessibility check on Order Journey page', async ({ homeTestPage, accessibility }) => {
    await homeTestPage.navigate();

    // Wait for page to load
    await homeTestPage.verifyPageLoaded();
    const hasViolations = await accessibility.runAccessibilityCheck(homeTestPage.page, "Get a self-test kit for HIV - NHS App prototype");
    expect(hasViolations).toBe(false);
  });
});
