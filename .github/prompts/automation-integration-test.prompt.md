Your goal is to generate Playwright Integration automation tests. When writing integration tests for the NHS Digital Health Checks project, follow these guidelines to ensure consistent, maintainable, and effective tests:

## Test Structure

1. Use the common test fixture for all integration tests:

```typescript
import { test, expect } from '../../fixtures/commonFixture';
```

2. Follow the test organization pattern:

- `test.describe` for the test suite
- `test.beforeEach`/`test.beforeAll` for setup
- `test.afterEach`/`test.afterAll` for cleanup
- Individual `test` cases with descriptive names
- Use `test.step` for logical test segments

3. Always include appropriate test tags (e.g., `@integration`, `@emis`, `@notify`)

## AWS Service Integration

1. DynamoDB Operations (via Service Clients):

```typescript
// DynamoDB service clients from lib/aws/dynamoDB/
dbHealthCheckService; // For health check operations
dbPatientService; // For patient operations
dbLabOrderService; // For lab order operations
dbAuditEvent; // For audit event operations
dbOdsCodeService; // For ODS code operations
```

2. Lambda Integration:

```typescript
// Lambda invocation pattern
const response = await lambdaService.runLambdaWithParameters(
  `${config.name}LambdaName`,
  {
    // Lambda payload
    healthCheckId,
    nhsNumber
    // ... other parameters
  }
);

// Assertions for Lambda response
expect(response.$metadata.httpStatusCode).toEqual(200);
expect(response.body).toMatchObject(expectedResponse);
```

3. SNS/SQS Message Testing:

```typescript
// SNS publication testing
test('should publish message to SNS topic', async ({ snsClient }) => {
  const messageId = await snsClient.publish({
    TopicArn: config.topicArn,
    Message: JSON.stringify(payload)
  });
  expect(messageId).toBeDefined();
});

// SQS message processing
test('should process SQS message', async ({ sqsClient }) => {
  await test.step('Send message to queue', async () => {
    await sqsClient.sendMessage({
      QueueUrl: config.queueUrl,
      MessageBody: JSON.stringify(testMessage)
    });
  });

  await test.step('Verify message processing', async () => {
    // Wait for message processing using service wait methods
    const result = await dbHealthCheckService.waitForStatusUpdate(
      healthCheckId,
      expectedStatus,
      testStartDate
    );
    expect(result).toBeTruthy();
  });
});
```

4. S3 Operations:

```typescript
// S3 file operations
test('should handle S3 file processing', async ({ s3Client }) => {
  // Upload test file
  await s3Client.putObjectInS3Bucket(
    bucketName,
    'test-file-key',
    testFileContent
  );

  // Wait for file processing
  const processedFile = await s3Client.waitForFileByPartialKeyName(
    outputBucketName,
    'processed/',
    healthCheckId,
    testStartDate
  );

  // Verify file contents
  const fileContent = await s3Client.getS3ObjectDetails(
    outputBucketName,
    processedFile.Key
  );
  expect(fileContent).toMatchObject(expectedContent);
});
```

5. Event-Driven Integration Testing:

```typescript
test('should handle complete event flow', async ({
  snsClient,
  sqsClient,
  lambdaService,
  dbHealthCheckService
}) => {
  const testStartDate = new Date().toISOString();

  await test.step('Trigger event via SNS', async () => {
    await snsClient.publish({
      TopicArn: config.eventTopicArn,
      Message: JSON.stringify(eventPayload)
    });
  });

  await test.step('Verify Lambda processing', async () => {
    // Wait for Lambda to process event
    const result = await dbHealthCheckService.waitForProcessingComplete(
      healthCheckId,
      testStartDate
    );
    expect(result.status).toEqual('COMPLETED');
  });

  await test.step('Verify output message in SQS', async () => {
    const messages = await sqsClient.receiveMessage({
      QueueUrl: config.outputQueueUrl,
      WaitTimeSeconds: 20
    });
    expect(messages).toContainEqual(
      expect.objectContaining({
        MessageBody: expect.stringContaining(expectedOutput)
      })
    );
  });
});
```

2. Always destructure services from the test fixture:

```typescript
test('My integration test', async ({
  dbHealthCheckService,
  dbPatientService,
  lambdaService,
  s3Client
}) => {
  // Test implementation
});
```

## Test Data Management

1. Use test data helpers from `testData/` directory:

```typescript
import { getPatientDbItem } from '../../testData/patientTestData';
import { healthyHealthCheckQuestionnaire } from '../../testData/questionnairesTestData';
```

2. Create unique IDs for test resources:

```typescript
import { v4 as uuidv4 } from 'uuid';
const healthCheckId = uuidv4();
```

## Setup and Cleanup

1. Setup Pattern:

```typescript
test.beforeEach(async ({ dbHealthCheckService, dbPatientService }) => {
  // 1. Generate test data
  const testData = {
    id: uuidv4()
    // ... other required fields
  };

  // 2. Clean existing data if necessary
  await dbHealthCheckService.deleteItemByNhsNumber(nhsNumber);

  // 3. Create test resources
  await dbHealthCheckService.createHealthCheck(testData);
  await dbPatientService.createPatient(patientData);
});
```

2. Cleanup Pattern:

```typescript
test.afterEach(async ({ dbHealthCheckService, dbPatientService }) => {
  // Delete all created resources
  await dbHealthCheckService.deleteItemById(healthCheckId);
  await dbPatientService.deletePatientItemByNhsNumber(nhsNumber);
});
```

## Asynchronous Operations

1. Use service wait methods for eventual consistency:

```typescript
const searchedS3File = await s3Client.waitForFileByPartialKeyName(
  bucketName,
  'FileRecord',
  healthCheckId,
  testStartDate
);

const lastMessage = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
  nhsNumber,
  AuditEventType.DnhcResultsWrittenToGp,
  testStartDate
);
```

2. Track operation start times for waitable operations:

```typescript
const testStartDate = new Date().toISOString();
```

## Assertions

1. Make specific assertions about the response:

```typescript
expect(response.$metadata.httpStatusCode).toEqual(200);
```

2. Include descriptive error messages:

```typescript
expect(
  qRiskScoresUpdated,
  'qRisk was not updated correctly in the HealthCheck'
).toBeTruthy();
```

3. Use test steps for logical grouping of assertions:

```typescript
await test.step('Verify response payload', async () => {
  expect(payloadContents).toContain(expectedMessage);
});
```

## AWS Configuration and Mocking

1. Environment Configuration:

```typescript
import { type Config, ConfigFactory } from '../../env/config';
const config: Config = new ConfigFactory().getConfig();

// Skip tests based on configuration
test.skip(
  config.emisMock === false,
  'Only runs on environments with Emis Mock Api deployed'
);
```

2. AWS Resource Configuration:

```typescript
// Configure AWS resource ARNs/URLs
const snsTopicArn = config.topicArn;
const sqsQueueUrl = config.queueUrl;
const lambdaName = `${config.name}LambdaFunction`;
const s3BucketName = config.bucketName;
```

3. Test Environment Selection:

```typescript
// Skip tests based on AWS environment
test.skip(
  process.env.AWS_SAM_LOCAL === 'true',
  'Skip when running against local SAM'
);

// Handle different AWS stages
const isProduction = config.stage === 'prod';
const testData = isProduction ? prodTestData : devTestData;
```

4. AWS Service Mocking:

```typescript
// Mock AWS service responses when needed
test.beforeEach(async ({ mockAwsService }) => {
  await mockAwsService.mockLambdaResponse(lambdaName, {
    statusCode: 200,
    body: mockResponse
  });

  await mockAwsService.mockSnsPublish(snsTopicArn, {
    MessageId: 'mock-message-id'
  });
});

// Verify AWS service calls
test('should call AWS services correctly', async ({ mockAwsService }) => {
  await verifyLambdaWasCalled(lambdaName, expectedPayload);
  await verifySnsMessageWasPublished(snsTopicArn, expectedMessage);
});
```

5. AWS Resource Cleanup:

```typescript
test.afterEach(async ({ s3Client, sqsClient, dbHealthCheckService }) => {
  // Clean up S3 objects
  await s3Client.deleteObjectInS3Bucket(bucketName, testFileKey);

  // Purge test messages from SQS
  await sqsClient.purgeQueue({ QueueUrl: config.queueUrl });

  // Clean up DynamoDB records
  await dbHealthCheckService.deleteItemById(healthCheckId);
});
```

## Best Practices

1. Always use strongly typed interfaces for data:

```typescript
import { type HealthCheckDbItem } from '../../lib/aws/dynamoDB/DbHealthCheckService';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
```

2. Clean up ALL created resources in afterEach/afterAll:

- Database records
- S3 objects
- Any other persistent resources

3. Use environment-aware test data:

```typescript
test.skip(config.integratedEnvironment);
```

4. Handle long-running tests:

```typescript
test('Long running test', { tag: ['@integration'] }, async () => {
  test.slow();
  // Test implementation
});
```

## Example Test Structure

````typescript
test.describe('Integration test suite', () => {
  let healthCheckId: string;
  let testData: HealthCheckDbItem;

  test.beforeEach(async ({ dbHealthCheckService }) => {
    healthCheckId = uuidv4();
    testData = {
      id: healthCheckId,
      // ... other required fields
    };
    await dbHealthCheckService.createHealthCheck(testData);
  });

  test.afterEach(async ({ dbHealthCheckService }) => {
    await dbHealthCheckService.deleteItemById(healthCheckId);
  });

  test('should process health check successfully', async ({ lambdaService }) => {
    const testStartDate = new Date().toISOString();

    await test.step('Invoke lambda', async () => {
      const response = await lambdaService.runLambdaWithParameters(
        'LambdaName',
        payload
      );
      expect(response.$metadata.httpStatusCode).toEqual(200);
    });

    await test.step('Verify results', async () => {
      // Assertions
    });
  });
});

## Goal of the Playwright API test file

The test should cover:

- Lambdas that are not triggered using API (by S3, SNS, SQS or manually)
- That lambdas save data in the expected data source
- Lambda handles positive and negative scenarios

## Getting information about the integrated services

- AWS service services are stored in `lib/aws` directory
- Ask for the way that lambda is triggered (S3, SNS, SQS or manually)
- Ask for the API specification for given resource with data models
- Ask for where the lambda saves data (DynamoDB, S3, etc.)
- Wait for data to apear in data source using polling strategy with given number of retries and delay between retries

## Location of the test file

- The test file should be named `<feature-name>.spec.ts`
- Place the file in the appropriate subdirectory under `tests/tests/` based on the feature category:
  1. `Integration/` - Dedicated for testing integration points (for instance lambdas, external services)

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
````

## Step 2: Integration test setup

- Check the `lib/aws` directory for existing AWS service classes for common services like S3, SNS, SQS, dynamoDB, etc.
- Create AWS service classes if they do not exist
- Create data models required for the integration test in `testData` directory

## Step 3: Test Cases to Include

1. **Happy Path Tests**

   - Lambda is triggered correctly
   - Lambda processes data correctly
   - Data is saved in the expected data source

2. **Negative cases**

   - Lambda handles invalid inputs gracefully
   - Lambda handles errors correctly

## Step 4: Suggest unit test coverage

Avoid automating edge cases and negative scenarios on the UI test level. Instead, suggest coverage in unit tests. However, you can include some basic checks in the UI tests to ensure that the application behaves correctly under normal conditions.

1. **Edge cases**

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
