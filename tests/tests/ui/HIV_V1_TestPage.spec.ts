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

  test('home testing prototype page', async ({ homeTestPage }) => {
    const actualResult = homeTestPage.getText();
    expect(actualResult, "Get a self-test kit for HIV");
  });







});
``

