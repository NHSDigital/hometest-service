Your goal is to generate Playwright automation tests. Follow the guidelines below to ensure consistency and maintainability.

## Goal of the Playwright test file

The test should cover:

- End-to-end user journeys
- Accessibility testing for each page
- Visual regression testing where appropriate
- Error handling and edge cases
- Cross-browser compatibility

## Finding the correct page to test

- Ask for the `page-name` or `feature` under test, this should correspond to a page or functionality in the web application
- Search through all the folders in `tests/page-objects` to find relevant page objects
- Search through `tests/tests` to find any existing related tests
- Remember the file paths as they will be needed for imports

## Location of the test file

- The test file should be named `<feature-name>.spec.ts`
- Place the file in the appropriate subdirectory under `tests/tests/` based on the feature category:
  1. `Accessibility/` - Dedicated accessibility test suites
  2. `E2E/` - For E2E tests that covers whole application user journeys
  3. `UI/` - For UI tests that are not covered by E2E tests

## Step 1: Basic Test Structure

```typescript
import { test } from '../fixtures/fixture';
import { expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup code: login, navigation, etc.
  });

  test('should do something when condition', async ({ page, context }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Step 2: Page Object Setup

- Page objects are created in pageObjectsFixture.ts files so they are injected into playwright fixture context
- Page object encapsulates web elements
- Page object methods encapsulate interactions with the page
- Keep selectors in page objects, not in test files
- Create a page object per page

## Step 3: Test Cases to Include

1. **Happy Path Tests**

   - Main user journey
   - Expected interactions
   - Successful form submissions

2. **Accessibility Tests**

   - WCAG compliance checks
   - Screen reader compatibility
   - Keyboard navigation

## Step 4: Suggest unit test coverage

Avoid automating edge cases and negative scenarios on the UI test level. Instead, suggest coverage in unit tests. However, you can include some basic checks in the UI tests to ensure that the application behaves correctly under normal conditions.

1. **Negative Cases**

   - Invalid input handling
   - Network error scenarios
   - Validation messages

2. **Edge Cases**

   - Boundary values
   - Empty states
   - Large data sets

## Step 5: Best Practices

1. **Test Structure**

   - Use descriptive test names in format "should <expected behavior> when <condition>"
   - Group related tests using `test.describe`
   - Use `test.beforeEach` for common setup
   - Use `test.afterEach` for cleanup

2. **Assertions**

   - Use explicit assertions with clear error messages
   - Check both UI state and underlying data
   - Verify accessibility for each significant state
   - Add message for every assertion to make it clear why assertion failed

3. **Data Management**

   - Use test fixtures for data setup
   - Clean up test data after tests
   - Use unique identifiers for test data

4. **Error Handling**
   - Add proper error handling with try-catch
   - Add retry logic for flaky operations
   - Add proper timeouts for async operations

## Example Test Structure

```typescript
import { test } from '../fixtures/fixture';
import { expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login-page';
import { HomePage } from '../page-objects/home-page';
import { testData } from '../fixtures/test-data';

test.describe('Login Feature', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    await loginPage.goto();
  });

  test('should successfully log in with valid credentials', async ({
    page
  }) => {
    // Arrange
    const { username, password } = testData.validUser;

    // Act
    await loginPage.login(username, password);

    // Assert
    await expect(homePage.welcomeMessage).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error message with invalid credentials', async ({
    page
  }) => {
    // Arrange
    const { username, password } = testData.invalidUser;

    // Act
    await loginPage.login(username, password);

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(/Invalid credentials/);
  });

  test('should be accessible', async ({ page }) => {
    await expect(page).toHaveNoViolations();
  });
});
```

## Documentation

- Add JSDoc comments for test descriptions
- Document test prerequisites
- Document test data requirements
- Document expected behaviors
- Document any environment-specific requirements

## Code Style

- Follow the existing code style in the repository
- Use consistent naming conventions
- Use proper TypeScript types
- Keep tests focused and concise
- Add proper error messages in assertions

## Test Data Management

- Use test fixtures for common data
- Use test data builders when needed
- Clean up test data after tests
- Use unique identifiers for test data
- Keep sensitive test data in environment variables

Remember to:

- Keep tests independent
- Keep tests focused on one thing
- Use appropriate waiting strategies
- Handle timeouts appropriately
- Clean up after tests
- Follow accessibility guidelines
- Document any special requirements
