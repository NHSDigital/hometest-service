import { test, expect } from '../fixtures';
import { runAccessibilityTest } from '../libs/AccessibilityTestHelper';


test('has title WP', async ({ page, wpHomePage }) => {
    await wpHomePage.navigate();
    const violations = await runAccessibilityTest(page, 'wp.pl-homepage');
    expect(violations).toHaveLength(0);

    await expect(page).toHaveTitle("Wirtualna Polska - Wszystko co ważne, na Twojej stronie");
  });



test.describe('Example Test Suite', () => {
  test('has title', async ({ page, playwrightDevPage }) => {
    await playwrightDevPage.navigate();

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('get started link', async ({ page, playwrightDevPage }) => {
    await playwrightDevPage.navigate();
    // Run accessibility test
    const violations = await runAccessibilityTest(page, 'get-started-page');
    expect(violations).toHaveLength(0);
    // Click the get started link.
    await playwrightDevPage.clickGetStarted();

    // Expects page to have a heading with the name of Installation.
    await expect(playwrightDevPage.installationHeading).toBeVisible();
    violations.push(...await runAccessibilityTest(page, 'installation-page'));
    expect(violations).toHaveLength(0);
  });
});

test.describe('API Testing Example', () => {
  test('should return 200 for GET request', async ({ request }) => {
    const response = await request.get('https://playwright.dev/');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});
