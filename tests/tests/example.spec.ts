import { test, expect } from '../fixtures';
import { Logger } from '../utils';


test('has title WP', async ({ page, wpHomePage, accessibility }) => {
    await wpHomePage.navigate();
    const hasViolations = await accessibility.runAccessibilityCheck(page, 'wp.pl-homepage');
    expect(hasViolations).toBe(false);

    await expect(page).toHaveTitle("Wirtualna Polska - Wszystko co ważne, na Twojej stronie");
  });



test.describe('Example Test Suite', () => {
  test('has title', async ({ page, playwrightDevPage }) => {
    Logger.log('Starting navigation test');
    await playwrightDevPage.navigate();

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
    Logger.log('Title verification passed');
  });

  test('get started link', async ({ page, playwrightDevPage, accessibility }) => {
    await Logger.wrapInLogs('Navigate and Click Get Started', async () => {
      await playwrightDevPage.navigate();
      Logger.log('Homepage loaded');
      
      // Run accessibility test
      const hasViolations = await accessibility.runAccessibilityCheck(page, 'get-started-page');
      expect(hasViolations).toBe(false);
      Logger.log('Accessibility check passed');
      
      // Click the get started link.
      await playwrightDevPage.clickGetStarted();
      Logger.log('Clicked Get Started link');

      // Expects page to have a heading with the name of Installation.
      await expect(playwrightDevPage.installationHeading).toBeVisible();
      
      const installViolations = await accessibility.runAccessibilityCheck(page, 'installation-page');
      expect(installViolations).toBe(false);
      Logger.log('Installation page verified');
    });
  });
});

test.describe('API Testing Example', () => {
  test('should return 200 for GET request', async ({ request }) => {
    const response = await request.get('https://playwright.dev/');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});
