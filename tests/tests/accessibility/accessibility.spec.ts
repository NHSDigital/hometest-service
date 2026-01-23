import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { FindAddressPage, WPHomePage } from '../../page-objects';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing @accessibility', () => {

  let context: BrowserContext;
  let page: Page;
  let wpHomePage: WPHomePage;

  test('should pass accessibility check on Order Journey page', async ({ page, accessibility }) => {
    const wpHomePage = new WPHomePage(page);
    const findAddressPage = new FindAddressPage(wpHomePage);
    await wpHomePage.navigate();
    await wpHomePage.enterPassword();
    await wpHomePage.navigateOrderJourney();

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Scan on  'Order Journey Page'.
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    await wpHomePage.clickStartNowButton();
    await findAddressPage.validatePostcode('SW1A 1AA', 'Buckingham Palace');
    await page.waitForLoadState('domcontentloaded');

    //Scan on 'select-delivery-address'
    const accessibilityScanResults1 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults1.violations).toEqual([]);

    page.close();
  });


});
