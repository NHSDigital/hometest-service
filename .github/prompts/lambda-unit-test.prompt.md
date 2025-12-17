Your goal is to generate Jest tests for services used within the `lambdas/src/` directory. Follow the guidelines below to ensure consistency with NHS Digital standards and established patterns.

## Overview

The test files should follow these key principles:

- Use `ts-sinon` for mocking and stubbing
- Follow Arrange-Act-Assert pattern
- Use descriptive test names with "When/Should" format
- Include comprehensive test data setup
- Test both success and error scenarios
- Use parameterized tests for related cases
- Maintain TypeScript type safety

## Test File Structure

1. **File Location and Naming**

   - Place in `lambdas/__tests__/` mirroring the service's directory structure
   - Name as `service-name.test.ts`
   - Example: `address-lookup-service.test.ts` for `address-lookup-service.ts`

2. **Basic Test Structure**

```typescript
import Sinon from 'ts-sinon';
import * as uuid from 'uuid';
import { Commons } from '../../../src/lib/commons';
import { ServiceDependency } from '../path/to/dependency';
import { Service } from '../path/to/service';

jest.mock('uuid');
const mockUuid = 'mockUUID';

jest.spyOn(uuid, 'v4').mockReturnValue(mockUuid);

describe('ServiceName', () => {
  const sandbox = Sinon.createSandbox();

  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dependencyStub: Sinon.SinonStubbedInstance<ServiceDependency>;
  let service: Service;

  // Test data setup
  const testInput = 'example input';
  const expectedOutput = {
    // expected response structure
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dependencyStub = sandbox.createStubInstance(ServiceDependency);

    service = new Service(
      commonsStub as unknown as Commons,
      dependencyStub as unknown as ServiceDependency
    );

    // Setup default stub behaviors
    dependencyStub.someMethod.resolves(expectedOutput);
  });

  afterEach(() => {
    sandbox.reset();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('Should handle successful case', async () => {
      const result = await service.methodName(testInput);

      sandbox.assert.calledOnceWithExactly(
        dependencyStub.someMethod,
        testInput
      );
      expect(result).toMatchObject(expectedOutput);
    });

    it('When dependency fails, should throw error', async () => {
      const error = new Error('dependency error');
      dependencyStub.someMethod.throwsException(error);

      await expect(service.methodName(testInput)).rejects.toThrow(error);
    });
  });
});
```

## Test Data Best Practices

1. **Define Test Data at Top Level**

   ```typescript
   const testInput = 'ABC 123';
   const mockResponse = {
     // Mock response structure
   };
   const expectedOutput = {
     // Expected output structure
   };
   ```

2. **Use Parameterized Tests for Related Cases**
   ```typescript
   it.each([
     ['case1', input1, expected1],
     ['case2', input2, expected2]
   ])('Should handle %s correctly', async (_, input, expected) => {
     const result = await service.method(input);
     expect(result).toMatchObject(expected);
   });
   ```

## Testing Patterns

1. **Dependency Mocking**

   ```typescript
   // Create stubs
   const dependencyStub = sandbox.createStubInstance(Dependency);

   // Configure responses
   dependencyStub.method.resolves(mockResponse);
   // or for errors
   dependencyStub.method.throwsException(new Error('error'));
   ```

2. **Assertion Patterns**

   ```typescript
   // Verify dependency calls
   sandbox.assert.calledOnceWithExactly(dependencyStub.method, expectedArg);

   // Verify response structure
   expect(result).toMatchObject(expectedOutput);

   // Verify error handling
   await expect(service.method(input)).rejects.toThrow(error);
   ```

3. **Complex Object Handling**
   - Use interfaces for type safety
   - Define expected objects explicitly
   - Use `toMatchObject` for partial matches
   - Include only relevant properties in assertions

## Implementation Steps

### Step 1: Setup and Dependencies

1. **Import Requirements**

   ```typescript
   import Sinon from 'ts-sinon';
   import { Service } from '../path/to/service';
   import { Dependencies } from '../path/to/dependencies';
   import { testData } from './test-data';
   ```

2. **Mock Setup**

   ```typescript
   const sandbox = Sinon.createSandbox();
   let serviceInstance: ServiceType;
   let mockDep1: SinonStubbedInstance<Dep1Type>;
   let mockDep2: SinonStubbedInstance<Dep2Type>;
   ```

3. **Test Hooks**

   ```typescript
   beforeEach(() => {
     mockDep1 = sandbox.createStubInstance(Dep1);
     mockDep2 = sandbox.createStubInstance(Dep2);
     serviceInstance = new Service(mockDep1, mockDep2);
   });

   afterEach(() => {
     sandbox.restore();
   });
   ```

### Step 2: Core Test Cases

1. **Service Initialization**

   ```typescript
   test('should initialize with dependencies', () => {
     expect(serviceInstance).toBeInstanceOf(Service);
   });
   ```

2. **Happy Path**

   ```typescript
   test('should process valid input successfully', async () => {
     const input = testData.validInput;
     mockDep1.method.resolves(expectedResult);

     const result = await serviceInstance.process(input);

     expect(result).toEqual(expectedOutput);
     sandbox.assert.calledWith(mockDep1.method, input);
   });
   ```

3. **Error Handling**

   ```typescript
   test('should handle errors appropriately', async () => {
     const error = new Error('Test error');
     mockDep1.method.rejects(error);

     await expect(serviceInstance.process(input)).rejects.toThrow(error);
   });
   ```

### Step 3: Common Patterns

1. **Date/Time Mocking**

   ```typescript
   const mockDate = new Date('2024-01-01T00:00:00Z');
   jest.useFakeTimers();
   jest.setSystemTime(mockDate);
   ```

2. **UUID Mocking**

   ```typescript
   import * as uuid from 'uuid';
   jest.mock('uuid');
   jest.spyOn(uuid, 'v4').mockReturnValue('mock-uuid');
   ```

3. **AWS Service Mocking**
   ```typescript
   const mockAwsResponse = {
     promise: () =>
       Promise.resolve({
         /* ... */
       })
   };
   mockAwsService.method.returns(mockAwsResponse);
   ```

## Best Practices

1. **Test Organization**

   - Group related tests using `describe`
   - Use clear, descriptive test names
   - Follow AAA pattern (Arrange-Act-Assert)
   - Keep tests focused and atomic

2. **Mock Management**

   - Reset mocks between tests
   - Verify mock calls when relevant
   - Use type-safe mocks
   - Mock at the right level

3. **Error Handling**

   - Test both success and failure paths
   - Verify error messages
   - Check error types
   - Test error propagation

4. **Code Quality**
   - Follow TypeScript best practices
   - Use proper typing
   - Avoid test duplication
   - Keep tests maintainable

## Review Checklist

- [ ] All public methods are tested
- [ ] Error cases are covered
- [ ] Mocks are properly typed
- [ ] Assertions are meaningful
- [ ] Tests are isolated
- [ ] Documentation is clear
- [ ] No test data leakage
- [ ] Proper cleanup in afterEach

## Finalizing the jest test file

- Ensure that the test file is well-structured, with clear and descriptive test names.
- Include comments where necessary to explain the purpose of each test.
- ensure the goal mentioned at the start of this prompt is met.
