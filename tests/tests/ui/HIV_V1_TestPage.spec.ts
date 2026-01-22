import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures';
import { WPHomePage } from '../../page-objects';
import { Logger } from '../../utils';
import { Page, BrowserContext } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  let context: BrowserContext;
  let page: Page;
  let wpHomePage: WPHomePage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    wpHomePage = new WPHomePage(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('home testing prototype page', async () => {
    await wpHomePage.navigate();
    await wpHomePage.enterPassword();
    await wpHomePage.navigateOrderJourney();

    await wpHomePage.contentAssertions('h1', 'Get a self-test kit for HIV', 0);
    await wpHomePage.contentAssertions('h2', 'Urgent advice: Go to a sexual health clinic if:', 0);
    await wpHomePage.contentAssertions('h2', 'How it works', 1);
    await wpHomePage.contentAssertions('h2', 'About using this service', 2);
    await wpHomePage.contentAssertions('h2', 'Other options to home testing, and more support', 3);
  });

  test('click Start Now button to navigate to find delivery address page', async () => {
    await wpHomePage.clickStartNowButton();
  });






});
``

