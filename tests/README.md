# Health Check Test framework

## Prerequisites

Install dependencies

```
npm install
npx playwright install
```

Set up environment name (environment variable)

```
ENV=<your_env_name>
```

Set up aws account name, if different from 'poc' (environment variable)

```
AWS_ACCOUNT_NAME=int or AWS_ACCOUNT_NAME=test
```

If your environment is deployed with a mocked NHS login, you need to add to your test config file:

```
 "authType": "mocked"
```

If your environment is integrated with a real NHS login, you need to add to your test config file (depends on env):

```
 "authType": "sandpit" / "authType": "aos"
and
 "integratedEnvironment": "true"
```

### Auth Token Generation

All Health Check APIs require an authorization token. It is available in the auth cookie after a successful login.

The token is automatically generated in the framework once, at the beginning using the global-setup.ts script.
It will be used in all API tests in a single run.

We can manually generate an auth token by running the global-setup.ts script with command:

```

ENV=your_env_name npx playwright test global-setup.ts --project=chromium
```

Token will be available in the LoginAuth.json file, in the cookies item. You can copy the token from the cookie with the name 'auth'.

```
      "name": "auth",
      "value": "token_to_copy",
      ...
```

If you have a valid token in the LoginAuth.json file and would like to reduce testing time you can comment a 'globalSetup' option in the 'playwright.config.ts' file.
With such configuration token will not be generated during the framework run.

```
  /* Playwright setup to run once before all tests */
  // globalSetup: './global-setup.ts',
```

### UI tests

To make UI tests work you need to create the 'credentials.ts' file in the main test framework folder:

```

export const userPasswordGeneric = ' '; // correct password for Generic users
export const userPasswordDhc = ' '; // correct password for DHC users
export const OTP = ' '; // correct one time password
```

## Local Configuration

The `tests/env/local.json` file allows you to override configuration settings that apply only when running tests locally. This file is useful for customizing your local test environment without affecting other environments.

### Available Configuration Options

- `localNumberOfWorkers`: Controls the number of parallel workers for local test execution (default: depends on the environment)
- `globalSetupBrowserHeadless`: Determines whether the browser runs in headless mode during local setup (default: `true`)
- `testBrowserHeadless`: Specifies if tests are going to be run in headless mode (default: `true`)

### Example Configuration

```json
{
  "localNumberOfWorkers": 1,
  "globalSetupBrowserHeadless": false,
  "testBrowserHeadless": false
}
```

**Note:** These settings only apply when running tests locally and do not affect CI/CD or other environment configurations.

## Running tests

### Run all tests

To run all tests in the 'test' environment

```
npm run test:test
```

or

```
ENV=test npx playwright test --project=chromium
```

### Run tests file by tag, for example '@api', on 'dev' env

```
ENV=dev npx playwright test --grep @api --project=chromium
```

### Run single test file by filename

```
npx playwright test ./tests/File_name.spec.ts  --project=chromium
```

### Run accessibility tests on 'dev' env

```
ENV=dev npx playwright test ./tests/Accessibility/accessibilityTest.spec.ts --project=chromium
```

### Run API tests on 'test' env, on 'test' AWS account name

```
ENV=test AWS_ACCOUNT_NAME=test npx playwright test ./tests/API/* --project=chromium
```

## Other test framework config options

If your environment is deployed with toggle ENABLE_AUTO_EXPIRY=true, you can run integration tests for the auto expiry feature by adding the option:

```
 "autoExpiryEnabled": true
```

If your environment has a reporting feature enabled, you can tests for it by adding the option:

```
 "reportingEnabled": true
```

If your environment is integrated with the real EMIS API, you need to add the option below (for skipping some tests written only for EMIS mock):

```
 "emisMock": false,
```

If your environment is configured to send email notification, you can test it by adding the option:

```
 "verifyEmails": true,
```

If you'd like to leave part of the test data created during the test framework run, you can do it by setting the bulkCleanupEnabled option to 'false':

```
 "bulkCleanupEnabled": false,
```

## Known issues

In case of problems with certificates (`unable to get local issuer certificate`) please follow the instructions for Node.js certificate setup for zscaler on Kainos intranet
