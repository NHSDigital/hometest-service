import { defineConfig, devices } from "@playwright/test";
import { AuthType, ConfigFactory } from "./configuration/EnvironmentConfiguration";
import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const config = ConfigFactory.getConfig();

export const getNumberOfWorkers = (authType: AuthType): number => {
  // Run only 1 worker for local environment
  const env = ConfigFactory.getEnvironment();
  if (env === "local") {
    return 1;
  }

  switch (authType) {
    case AuthType.SANDBOX:
      return 2;
    default:
      return 1;
  }
};

export const defaultUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Output directory for test artifacts */
  outputDir: "./testResults/artefacts",
  /* Global setup script */
  globalSetup: "./global-setup.ts",
  /* Global teardown script */
  globalTeardown: "./global-teardown.ts",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: getNumberOfWorkers(config.authType),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["list"],
    ["json", { outputFile: "./testResults/test-results.json" }],
    ["junit", { outputFile: "./testResults/junit-results.xml" }],
    ["html", { outputFolder: "./testResults/html", open: "on-failure" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: { mode: "only-on-failure", fullPage: true },
    /* Video recording on failure */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers.
   * Set CHROMIUM_ONLY=true in configuration/.env.local to run only Chromium locally.
   */
  projects: config.chromiumOnly
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "safari",
          use: { ...devices["Desktop Safari"] },
        },
        {
          name: "edge",
          use: { ...devices["Desktop Edge"] },
        },
        {
          name: "mobileChromium",
          use: { ...devices["Pixel 5"] },
        },
        {
          name: "mobileSafari",
          use: { ...devices["iPhone 12"] },
        },
      ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
