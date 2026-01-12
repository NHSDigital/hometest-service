import { test, expect } from '@playwright/test';
import { runAccessibilityTest } from '../libs/AccessibilityTestHelper';


test('has title WP', async ({ page }) => {
    await page.goto('https://www.wp.pl');
    const violations = await runAccessibilityTest(page, 'wp.pl-homepage');
    expect(violations).toHaveLength(0);
    
    await expect(page).toHaveTitle("Wirtualna Polska - Wszystko co ważne, na Twojej stronie");
  });



test.describe('Example Test Suite', () => {
  test('has title', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('get started link', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    // Run accessibility test
    const violations = await runAccessibilityTest(page, 'get-started-page');
    expect(violations).toHaveLength(0);
    // Click the get started link.
    await page.getByRole('link', { name: 'Get started' }).click();

    // Expects page to have a heading with the name of Installation.
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
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
