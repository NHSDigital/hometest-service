Your goal is to generate Playwright API automation tests. Follow the guidelines below to ensure consistency and maintainability.

## Goal of the Playwright API test file

The test should cover:

- Test for API endpoints
- Checking if API saved data in expected data source
- Endpoint responds as expected in positive and negative scenarios

## Getting information about the API resource

- API resources are stored in `lib/apiClients` directory
- DynamoDB client is stored in `lib/aws/dynamoDbClient.ts`
- Ask for API gateway that given resource is part of
- Ask for API specification for given resource with data models

## Location of the test file

- The test file should be named `<feature-name>.spec.ts`
- Place the file in the appropriate subdirectory under `tests/tests/` based on the feature category:
  1. `API/` - Dedicated for testing API endpoints

## Step 1: Basic Test Structure

```typescript
import { test } from '../fixtures/fixture';
import { expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ context }) => {
    // Setup code: login, navigation, etc.
  });

  test('should do something when condition', async ({
    apiResource,
    context
  }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Step 2: API resource setup

- Create API resource classes for each resource
- Create data models for each resource in testData directory
- Create API resource objects in `apiResourcesFixture.ts` files so they are injected into playwright fixture context

## Step 3: Test Cases to Include

1. **Happy Path Tests**

   - 200 or 202 responses for valid requests

2. **Negative cases**

   - 400 Bad Request for invalid inputs
   - 401 Unauthorized for unauthenticated requests
   - 403 Forbidden for unauthorized access
   - 404 Not Found for non-existing resources
   - 500 Internal Server Error for server issues

## Step 4: Suggest unit test coverage

Avoid automating edge cases and negative scenarios on the UI test level. Instead, suggest coverage in unit tests. However, you can include some basic checks in the UI tests to ensure that the application behaves correctly under normal conditions.

1. **Negative Cases**

   - Invalid input handling
   - Network error scenarios
   - Boundary conditions

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
import { test, expect } from '../../../fixtures/commonFixture';

test.describe('Backend API, address endpoint', () => {
  test.describe('Address endpoint positive scenarios', () => {
    test(
      'GET request, fetch addresses for given postcode',
      {
        tag: ['@api', '@get', '@address']
      },
      async ({ backendApiResource }) => {
        const postcode = 'E18RD';
        const response =
          await backendApiResource.address.getAddressesByPostcode(postcode);

        console.log(`GET response status code: ${response.status()}`);
        expect(response.status()).toEqual(200);

        const responseBody: any = await response.json();
        const addresses: any[] = responseBody.addressList;
        const address = addresses.find((result) => {
          const addressString: string = result.postcode;
          return addressString.includes('E1 8RD');
        });
        expect(address).not.toBeUndefined();
      }
    );
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

- Use dynamo client to create, cleanup and verify data created by API tests
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
