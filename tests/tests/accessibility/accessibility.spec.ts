import { test, expect } from '../../fixtures';

test.describe('Accessibility Testing Examples @accessibility', () => {
  test('should pass accessibility check on Playwright homepage', async ({ page, accessibility }) => {
    // Navigate to page
    await page.goto('https://playwright.dev/');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Run accessibility check
    const hasViolations = await accessibility.runAccessibilityCheck(page, 'playwright-homepage');

    // Assert no violations found
    expect(hasViolations).toBe(false);
  });

  test('should detect and report accessibility violations', async ({ page, accessibility }) => {
    // Create a page with intentional accessibility issues
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Page with Accessibility Issues</title></head>
        <body>
          <h1>Accessibility Test Page</h1>

          <!-- Missing alt text on image -->
          <img src="test.jpg" />

          <!-- Missing label for input -->
          <input type="text" name="username" />

          <!-- Button without accessible name -->
          <button></button>

          <!-- Low contrast text -->
          <p style="color: #ccc; background: white;">This text has low contrast</p>
        </body>
      </html>
    `);

    // Run accessibility check
    const hasViolations = await accessibility.runAccessibilityCheck(page, 'test-page-with-issues');

    // Assert violations were found
    expect(hasViolations).toBe(true);
  });

  test('should check accessibility during user flow', async ({ page, accessibility, playwrightDevPage }) => {
    // Navigate to homepage
    await playwrightDevPage.navigate();

    // Check accessibility on homepage
    const homePageViolations = await accessibility.runAccessibilityCheck(page, 'homepage');
    expect(homePageViolations).toBe(false);

    // Navigate to Get Started page
    await playwrightDevPage.clickGetStarted();
    await expect(playwrightDevPage.installationHeading).toBeVisible();

    // Check accessibility on Get Started page
    const getStartedViolations = await accessibility.runAccessibilityCheck(page, 'get-started-page');
    expect(getStartedViolations).toBe(false);
  });

  test('should verify accessibility standards configuration', async ({ accessibility }) => {
    // Get current standards being used
    const standards = accessibility.getStandards();

    // Verify standards are configured
    expect(standards).toBeDefined();
    expect(standards.length).toBeGreaterThan(0);

    // Log standards for visibility
    console.log('Configured accessibility standards:', standards.join(', '));

    // Verify expected standards are included
    expect(standards).toContain('wcag2a');
    expect(standards).toContain('wcag2aa');
  });
});
