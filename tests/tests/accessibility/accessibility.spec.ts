import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { WPHomePage } from '../../page-objects';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing @accessibility', () => {

  let context: BrowserContext;
  let page: Page;
  let wpHomePage: WPHomePage;

  test('should pass accessibility check on Order Journey page', async ({ page, accessibility }) => {
    const wpHomePage = new WPHomePage(page);
    await wpHomePage.navigate();
    await wpHomePage.enterPassword();
    await wpHomePage.navigateOrderJourney();

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults1 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults1.violations).toEqual([]);

    page.close();
  });


});
