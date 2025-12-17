Your goal is to generate comprehensive Jest unit tests for React components and utilities in the `ui/src/` directory. Follow these guidelines to ensure consistency, maintainability, and NHS Digital standards compliance.

## Overview

The test files should ensure:

- Complete component behavior coverage
- check any subdependencies within components used that require mocking ie `usePageTitleContext`
- Proper rendering in different states
- Form validation and submission
- User interaction handling
- Error state management
- NHS Design System compliance
- Tests reference the exact text used in the component including any special character or symbols.

## Goals of the Test File

1. **Component Rendering**

   - Initial render state
   - Conditional rendering
   - Props validation
   - Children composition
   - Styling and layout
   - Responsive behavior

2. **User Interactions**

   - Click events
   - Form inputs
   - Keyboard navigation
   - Touch interactions
   - Error handling
   - Loading states

3. **Integration Points**
   - API interactions
   - Redux state management
   - Context usage
   - Custom hooks
   - Event handlers

- That the text expected on the page is present. (This will help spot future mistakes on the page)

## Component Analysis

1. **Locate the Component**

   - Ask for the `component-name`
   - Component should be in `ui/src/`
   - Identify component type (page, component, hook)
   - Note dependencies and imports

2. **Analyze Dependencies**

   - React hooks used
   - Context providers required
   - Redux connections
   - NHS Design System components
   - Custom hooks and utilities

3. **Required Context / Event Mocking**

   - Mock usePageTitleContext for error state management:

     ```typescript
     jest.mock('../../../../lib/contexts/PageTitleContext');

     let setIsPageInErrorMock: jest.Mock;

     beforeEach(() => {
       setIsPageInErrorMock = jest.fn();
       (usePageTitleContext as jest.Mock).mockReturnValue({
         isPageInError: false,
         setIsPageInError: setIsPageInErrorMock
       });
     });
     ```

   - Test error state management:

     - Check setIsPageInError is called with true when validation fails
     - Verify error messages are displayed
     - Once an error occurs on the page, the error persists regardless if a correction is made

   - Mocking auditEvents present in the page

   ```typescript
   jest.mock('../../../../lib/components/event-audit-button');

   test('after some action, audit event should be triggered', async () => {
     // some action where such as a click event
     expect(
       screen.getByText(
         JSON.stringify([
           {
             eventType: AuditEventType.DeliveryAddressEntered,
             healthCheck: healthCheck,
             patientId
           }
         ])
       )
     ).toBeInTheDocument();
   });
   ```

4. **Document Requirements**
   - Required props
   - Optional props
   - Event handlers
   - State management
   - Side effects

## Test File Organization

1. **File Location**

   - Create in `ui/src/__tests__/`
   - Mirror component directory structure
   - Name as `ComponentName.test.tsx`
   - Group related tests

2. **Test File Structure**

   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { RecoilRoot } from 'recoil';
   import { MemoryRouter } from 'react-router-dom';
   import { ComponentName } from '../path/to/component';
   import { TestProvider } from '../test-utils';
   import { usePageTitleContext } from '../lib/contexts/PageTitleContext';

   describe('ComponentName', () => {
     const defaultProps = {
       // Component props
     };

     const renderComponent = (props = {}) => {
       return render(
         <TestProvider>
           <RecoilRoot>
             <MemoryRouter>
               <ComponentName {...defaultProps} {...props} />
             </MemoryRouter>
           </RecoilRoot>
         </TestProvider>
       );
     };

     beforeEach(() => {
       // Mock the PageTitleContext
       setIsPageInErrorMock = jest.fn();
       (usePageTitleContext as jest.Mock).mockReturnValue({
         isPageInError: false,
         setIsPageInError: setIsPageInErrorMock
       });
     });

     afterEach(() => {
       jest.clearAllMocks();
     });

     describe('rendering', () => {
       test('should render correctly with default props', () => {
         renderComponent();
         expect(screen.getByRole('main')).toBeInTheDocument();
       });
     });

     describe('interactions', () => {
       test('should handle user input correctly', async () => {
         const onSubmit = jest.fn();
         renderComponent({ onSubmit });

         await userEvent.type(screen.getByLabelText('Name'), 'John');
         await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

         expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
       });
     });
   });
   ```

## Error State Testing

1. **Validation Error Tests**

   ```typescript
   test('should show error when form submitted without selection', async () => {
     const user = userEvent.setup();
     renderComponent();

     await user.click(screen.getByRole('button', { name: /continue/i }));

     expect(screen.getByText('Error message here')).toBeInTheDocument();
     expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
   });
   ```

2. **Error State Clearing**

   ```typescript
   test('should clear error state when valid selection made', async () => {
     const user = userEvent.setup();
     renderComponent();

     // Trigger error first
     await user.click(screen.getByRole('button', { name: /continue/i }));
     expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);

     // Make valid selection and submit
     await user.click(screen.getByRole('radio', { name: 'Valid option' }));
     await user.click(screen.getByRole('button', { name: /continue/i }));

     expect(setIsPageInErrorMock).toHaveBeenCalledWith(false);
   });
   ```

## Implementation Guide

### Step 1: Basic Test Setup

1. **Import Required Dependencies**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Component } from './Component';
```

2. **Mock Dependencies**

```typescript
jest.mock('@/services/api');
jest.mock('@/hooks/useAuth');

let setIsPageInErrorMock: jest.Mock;

beforeEach(() => {
  setIsPageInErrorMock = jest.fn();
  (usePageTitleContext as jest.Mock).mockReturnValue({
    isPageInError: false,
    setIsPageInError: setIsPageInErrorMock
  });
});
```

3. **Setup Test Utils**

```typescript
const mockProps = {
  title: 'Test Title',
  onAction: jest.fn()
};

const renderComponent = (props = {}) => {
  return render(<Component {...mockProps} {...props} />);
};
```

### Step 2: Core Test Cases

1. **Rendering Tests**

```typescript
test('renders component with all required elements', () => {
  renderComponent();

  expect(screen.getByRole('heading')).toHaveTextContent('Test Title');
  expect(screen.getByRole('button')).toBeEnabled();
});
```

2. **Interaction Tests**

```typescript
test('handles form submission correctly', async () => {
  const onSubmit = jest.fn();
  renderComponent({ onSubmit });

  await userEvent.type(screen.getByLabelText('Name'), 'John');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'John'
    })
  );
});
```

### Step 3: NHS Design System Tests

1. **Component Styling**

```typescript
test('uses correct NHS styling', () => {
  renderComponent();

  const button = screen.getByRole('button');
  expect(button).toHaveClass('nhsuk-button');
});
```

2. **Error Messages**

```typescript
test('displays NHS-styled error message', async () => {
  renderComponent({ error: 'Invalid input' });

  const error = screen.getByRole('alert');
  expect(error).toHaveClass('nhsuk-error-message');
});
```

## Common Test Scenarios

1. **Form Validation**

```typescript
test('validates NHS number format', async () => {
  renderComponent();

  await userEvent.type(screen.getByLabelText('NHS Number'), '123');
  await userEvent.tab();

  expect(screen.getByText('Enter a valid NHS number')).toBeInTheDocument();
});
```

2. **Loading States**

```typescript
test('shows loading spinner during submission', async () => {
  renderComponent();

  await userEvent.click(screen.getByRole('button'));

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  await waitForElementToBeRemoved(() => screen.getByRole('progressbar'));
});
```

## Environment Variables and Settings

1. **Mocking Settings Module**

   When testing components that use environment variables or settings from the `settings.ts` module:

   ```typescript
   import * as settings from '../../../../settings';

   // Mock the entire settings module
   jest.mock('../../../../settings', () => ({
     addressTextInputMaxLength: 35
   }));

   // If you need to reference the mock value in tests, create a typed constant, cast the type to that required from the page under test
   const MOCK_ADDRESS_MAX_LENGTH = Number(
     (settings as jest.Mocked<typeof settings>).addressTextInputMaxLength
   );
   ```

   Key points:

   - Always import the settings module at the top of your test file.
   - Mock the settings module and set the variable used by our page under test
   - Use TypeScript casting to maintain type safety
   - extract the value to a constant for easy reference as shown on the example above
   - Use the mock values in your test assertions to ensure consistency

2. **Best Practices for Settings Mocks**

   - Keep mock values realistic and within expected ranges
   - Document why specific mock values were chosen
   - Consider edge cases in separate tests
   - Use the same mock value throughout related tests
   - Update mock values when requirements change

3. **Example Usage in Tests**

   ```typescript
   test('displays timeout message with correct duration', () => {
     renderComponent();

     expect(
       screen.getByText(
         `Session will timeout in ${MOCK_SESSION_EXPIRY_MINUTES} minutes`
       )
     ).toBeInTheDocument();
   });
   ```

## Review Checklist

- [ ] Renders without errors
- [ ] All required props tested
- [ ] User interactions covered
- [ ] Error states handled
- [ ] Loading states tested
- [ ] Accessibility tested
- [ ] NHS Design System compliance verified
- [ ] Props validation tested
- [ ] Event handlers verified
- [ ] Clean setup/teardown
- [ ] Clear test descriptions
- [ ] Proper mocking used

```

```
