import { type BrowserContext } from '@playwright/test';
import { test, expect } from '../../fixtures/commonFixture';
import { WafErrorPage } from '../../page-objects/WafErrorPage';

test.describe('Tests for bot user agent', () => {
  let wafErrorPage: WafErrorPage;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // The user agent mimics a Nessus security scanner,
    // triggering the WAF blocking rule and displaying the WAF error page
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; Nessus)'
    });
    wafErrorPage = new WafErrorPage(await context.newPage());
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Verify WAF error page is displayed', async ({ config }) => {
    await wafErrorPage.getPage().goto(config.questionnaireAppURL);
    await wafErrorPage.waitUntilLoaded();

    await expect(wafErrorPage.pageContainer).toBeVisible();
    await expect(wafErrorPage.pageHeader).toBeVisible();
    await expect(wafErrorPage.firewallBlockMessage).toBeVisible();
    await expect(wafErrorPage.nhs111Text).toBeVisible();
    await expect(wafErrorPage.nhs111Link).toBeVisible();
    expect(await wafErrorPage.getNhs111LinkHref()).toBe('https://111.nhs.uk/');
  });

  test('Verify clicking NHS header link navigates to nhs.uk', async ({
    config
  }) => {
    await wafErrorPage.getPage().goto(config.questionnaireAppURL);
    await wafErrorPage.waitUntilLoaded();

    await wafErrorPage.nhsHeaderLink.click();

    await expect(wafErrorPage.getPage()).toHaveURL('https://www.nhs.uk/');
  });
});

test.describe('Tests for default user agent', () => {
  test('Verify WAF error page is NOT displayed', async ({ page, config }) => {
    const wafErrorPage = new WafErrorPage(page);

    await page.goto(config.questionnaireAppURL);

    await expect(wafErrorPage.pageContainer).not.toBeVisible();
    await expect(wafErrorPage.pageHeader).not.toBeVisible();
    await expect(wafErrorPage.firewallBlockMessage).not.toBeVisible();
    await expect(wafErrorPage.nhs111Text).not.toBeVisible();
    await expect(wafErrorPage.nhs111Link).not.toBeVisible();
  });
});
