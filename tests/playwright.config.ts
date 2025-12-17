import { defineConfig, devices } from '@playwright/test';
import { AuthType, ConfigFactory } from './env/config';

const config = ConfigFactory.getConfig();

export const getNumberOfWorkers = (authType: AuthType): number => {
  if (config.localNumberOfWorkers !== undefined) {
    console.log(config.localNumberOfWorkers);
    return config.localNumberOfWorkers;
  }
  switch (authType) {
    case AuthType.AOS:
      return 5;
    case AuthType.MOCKED:
      return 7;
    case AuthType.SANDPIT:
      return 4;
    default:
      return 1;
  }
};

export const defaultUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export default defineConfig({
  timeout: 60_000,
  /* Default tests directory */
  testDir: './tests',
  /* Playwright setup to run once before all tests */
  globalSetup: config.integratedEnvironment
    ? './global-setup.ts'
    : './global-setup-mock.ts',
  /* Playwright setup to run once after all tests */
  globalTeardown: './global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !(process.env.CI == null),
  /* Retry on CI only */
  retries: process.env.CI != null ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: getNumberOfWorkers(config.authType),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        [
          '@estruyf/github-actions-reporter',
          {
            title: 'NHS Digital Health checks test results',
            quiet: true,
            useDetails: true,
            showError: true,
            includeResults: ['fail', 'flaky']
          }
        ],
        ['json', { outputFile: './testResults/test-results.json' }],
        ['html', { outputFolder: './testResults/html', open: 'on-failure' }]
      ]
    : [
        ['list', { printSteps: true }],
        ['json', { outputFile: './testResults/test-results.json' }],
        ['html', { outputFolder: './testResults/html', open: 'on-failure' }]
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    /* If you need to debug a failed tests, change trace value to:  trace: 'retain-on-failure' */
    /* This option will record trace for each test. When test run passes, remove the recorded trace */
    trace: 'on-first-retry',
    /* Capture screenshot after each test failure. */
    screenshot: { mode: 'only-on-failure', fullPage: true },
    clientCertificates: [
      {
        origin: config.mtlsResultsApiUrl,
        certPath: config.mtlsCertificatePath,
        keyPath: config.mtlsKeyPath,
        passphrase: config.mtlsPassphrase
      }
    ],
    headless: config.testBrowserHeadless ?? true
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] }
    },
    {
      name: 'mobileChromium',
      use: { ...devices['Pixel 5'] }
    },

    {
      name: 'mobileSafari',
      use: { ...devices['iPhone 12'] }
    }
  ]
});
