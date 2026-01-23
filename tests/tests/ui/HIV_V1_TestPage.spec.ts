import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures';
import { WPHomePage, FindAddressPage } from '../../page-objects';
import { Logger } from '../../utils';
import { Page, BrowserContext } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  let findAddressPage: FindAddressPage;

  test.beforeEach(async ({ wpHomePage }) => {
    findAddressPage = new FindAddressPage(wpHomePage);
    await wpHomePage.navigate();
    await wpHomePage.enterPassword();
    await wpHomePage.navigateOrderJourney();
  });

  test.afterAll(async ({ wpHomePage }) => {
    await wpHomePage.closeBrowser();
  })

  test('home testing prototype page', async ({ wpHomePage }) => {
    await wpHomePage.contentAssertions('h1', 'Get a self-test kit for HIV', 0);
    await wpHomePage.contentAssertions('h2', 'Urgent advice: Go to a sexual health clinic if:', 0);
    await wpHomePage.contentAssertions('h2', 'How it works', 1);
    await wpHomePage.contentAssertions('h2', 'About using this service', 2);
    await wpHomePage.contentAssertions('h2', 'Other options to home testing, and more support', 3);
  });

  test('click Start Now button to navigate to find delivery address page', async ({ wpHomePage }) => {
    // Verify navigation to Find Address page
    await wpHomePage.clickStartNowButton();
    await findAddressPage.navigateAndVerifyPage();
  });

  test('should display address results for a valid postcode', async ({ wpHomePage }) => {
    // Submit a valid postcode and verify address results
    await wpHomePage.clickStartNowButton();
    await findAddressPage.validatePostcode('SW1A 1AA', 'Buckingham Palace');
  });

});
``

