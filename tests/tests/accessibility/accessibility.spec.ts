import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { HomeTestPage } from '../../page-objects';
import AxeBuilder from '@axe-core/playwright';
import { AccessibilityModule } from '../../utils';

test.describe('Accessibility Testing @accessibility', () => {

  let context: BrowserContext;
  let page: Page;
  let wpHomePage: HomeTestPage;

  test('should pass accessibility check on Order Journey page', async ({ page, accessibility }) => {
    const wpHomePage = new HomeTestPage(page);
    await wpHomePage.navigate();
    await wpHomePage.enterPassword();
    await wpHomePage.navigateOrderJourney();

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await accessibility.runAccessibilityCheck(page, "Get a self-test kit for HIV - NHS App prototype");
  });


});
