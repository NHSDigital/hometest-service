import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures';
import { HomeTestPage } from '../../page-objects';
import { Logger } from '../../utils';
import { Page, BrowserContext } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {

  test.beforeEach(async ({ homeTestPage }) => {
    await homeTestPage.navigate();
    await homeTestPage.enterPassword();
    await homeTestPage.navigateOrderJourney();
  });

  test.afterAll(async ({ homeTestPage }) => {
    await homeTestPage.closeBrowser();
  })

  test('home testing prototype page', async ({ homeTestPage }) => {
    await homeTestPage.contentAssertions('Get a self-test kit for HIV');
  });
});
``

