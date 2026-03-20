import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { BaseTestUser } from "./BaseUser";
import { defaultUserAgent } from "../../playwright.config";

import { ConfigFactory } from "../../configuration/EnvironmentConfiguration";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { SpecialUserKey } from "./SpecialUserKey";

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  method: string;
  timestamp: string;
}

export abstract class BaseUserManager<TUser extends BaseTestUser> {
  protected readonly workerUsers: TUser[];
  private readonly numberOfWorkerUsers: number;
  protected readonly specialUsers: Map<SpecialUserKey, TUser>;
  protected abstract getWorkerUsers(): TUser[];
  protected abstract getSpecialUsers(): Map<SpecialUserKey, TUser>;
  protected abstract loginWorkerUser(user: TUser, page: Page): Promise<Page>;

  config = ConfigFactory.getConfig();

  constructor(numberOfWorkerUsers: number = 0) {
    this.numberOfWorkerUsers = numberOfWorkerUsers;

    if (numberOfWorkerUsers <= 0) {
      throw new Error("numberOfWorkerUsers must be greater than 0");
    }

    this.workerUsers = this.getWorkerUsers();
    this.specialUsers = this.getSpecialUsers();

    // if (numberOfWorkerUsers > this.workerUsers.length) {
    //   throw new Error(
    //     `numberOfWorkerUsers (${numberOfWorkerUsers}) exceeds available worker users (${this.workerUsers.length})`,
    //   );
    // }
  }

  protected getNumberOfWorkerUsers(): number {
    return this.numberOfWorkerUsers;
  }

  getWorkerUser(index: number): TUser {
    if (index < 0 || index >= this.workerUsers.length) {
      throw new Error(`Index out of bounds: ${index}`);
    }
    return this.workerUsers[index];
  }

  private static readonly SESSION_CACHE_DIR = "./.session-cache";

  getWorkerUserSessionFilePath(index: number): string {
    const cacheDir = BaseUserManager.SESSION_CACHE_DIR;
    fs.mkdirSync(cacheDir, { recursive: true });
    return path.join(cacheDir, `WorkerUserSession${index}.json`);
  }

  async initializeBrowserForInitialLogin(): Promise<{
    page: Page;
    browser: Browser;
    context: BrowserContext;
  }> {
    const browser: Browser = await chromium.launch({
      headless: this.config.headless ?? true,
      timeout: 60000,
    });
    const context = await browser.newContext({
      userAgent: defaultUserAgent,
    });
    const page = await context.newPage();
    return { page, browser, context };
  }

  private setupNetworkErrorCapture(page: Page): NetworkError[] {
    const networkErrors: NetworkError[] = [];

    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400) {
        networkErrors.push({
          url: response.url(),
          status,
          statusText: response.statusText(),
          method: response.request().method(),
          timestamp: new Date().toISOString(),
        });
        console.error(
          `❌ HTTP ${status} ${response.statusText()}: ${response.request().method()} ${response.url()}`,
        );
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`❌ Console error: ${msg.text()}`);
      }
    });

    return networkErrors;
  }

  private async captureFailureArtifacts(
    page: Page,
    context: BrowserContext,
    user: BaseTestUser,
    error: Error,
    networkErrors: NetworkError[],
  ): Promise<void> {
    const outputDir = "testResults/global-setup-failures";
    fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const prefix = `${outputDir}/global-setup-${user.nhsNumber}-${timestamp}`;

    try {
      // Take screenshot
      await page.screenshot({
        path: `${prefix}-screenshot.png`,
        fullPage: true,
      });
      console.log(`📸 Screenshot saved: ${prefix}-screenshot.png`);
    } catch (screenshotError) {
      console.error("Failed to capture screenshot:", screenshotError);
    }

    // Save network errors
    if (networkErrors.length > 0) {
      fs.writeFileSync(`${prefix}-network-errors.json`, JSON.stringify(networkErrors, null, 2));
      console.log(`🌐 Network errors saved: ${prefix}-network-errors.json`);
    }

    // Save error details
    fs.writeFileSync(
      `${prefix}-error.txt`,
      `Error: ${error.message}\n\nStack trace:\n${error.stack}\n\nNetwork errors:\n${JSON.stringify(networkErrors, null, 2)}`,
    );
    console.log(`📝 Error details saved: ${prefix}-error.txt`);

    // Save trace if tracing was enabled
    if (this.config.enableTracingOnGlobalSetup) {
      try {
        await context.tracing.stop({
          path: `${prefix}-trace.zip`,
        });
        console.log(`🔍 Trace saved: ${prefix}-trace.zip`);
      } catch (traceError) {
        console.error("Failed to save trace:", traceError);
      }
    }
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as Record<string, unknown>;
  }

  protected isSessionJwtValid(sessionFilePath: string): boolean {
    try {
      const content = fs.readFileSync(sessionFilePath, "utf8");
      const session = JSON.parse(content) as {
        cookies: Array<{ name: string; value: string }>;
      };
      const authCookie = session.cookies.find((c) => c.name === "auth");
      if (!authCookie) {
        return false;
      }
      const outerPayload = this.decodeJwtPayload(authCookie.value);
      const sessionId = outerPayload.sessionId;
      if (typeof sessionId !== "string") {
        return false;
      }
      const innerPayload = this.decodeJwtPayload(sessionId);
      const exp = innerPayload.exp;
      if (typeof exp !== "number") {
        return false;
      }
      return exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  protected async isSessionValid(sessionFilePath: string): Promise<boolean> {
    // Quick JWT expiry check first
    if (!this.isSessionJwtValid(sessionFilePath)) {
      return false;
    }
    // Verify the session is accepted by the live session endpoint.
    // This catches environment restarts where the signing key has changed.
    try {
      const content = fs.readFileSync(sessionFilePath, "utf8");
      const session = JSON.parse(content) as {
        cookies: Array<{ name: string; value: string }>;
      };
      const cookieHeader = session.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      const response = await fetch(`${this.config.apiBaseUrl}/session`, {
        method: "GET",
        headers: { Cookie: cookieHeader },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async loginWorkerUsers(): Promise<void> {
    process.env.GLOBAL_START_TIME = new Date().toISOString();
    console.log(`Tests will run on environment: ${process.env.ENV ?? "local"}`);

    for (let i = 0; i < this.workerUsers.length; i++) {
      if (i >= this.numberOfWorkerUsers) {
        console.log(
          `Skipping login for worker user at index ${i} due to numberOfWorkerUsers limit.`,
        );
        break;
      }

      const sessionFilePath = this.getWorkerUserSessionFilePath(i);
      console.log(sessionFilePath);

      const isLocal = (process.env.ENV ?? "local") === "local";
      if (
        isLocal &&
        fs.existsSync(sessionFilePath) &&
        (await this.isSessionValid(sessionFilePath))
      ) {
        console.log(`✅ Reusing existing valid session for worker user at index ${i}`);
        continue;
      }

      const user = this.workerUsers[i];
      const { browser, page, context } = await this.initializeBrowserForInitialLogin();

      // Setup network error capture
      const networkErrors = this.setupNetworkErrorCapture(page);

      if (this.config.enableTracingOnGlobalSetup) {
        await context.tracing.start({
          name: `global-setup-${uuidv4()}`,
          screenshots: true,
          snapshots: true,
        });
      }

      try {
        await this.loginWorkerUser(user, page);

        await page.context().storageState({
          path: sessionFilePath,
        });

        if (this.config.enableTracingOnGlobalSetup) {
          await context.tracing.stop({
            path: `testResults/global-setup-trace/global-setup-trace-${user.nhsNumber}.zip`,
          });
        }
      } catch (error) {
        console.error(`\n❌ Global setup failed for user ${user.nhsNumber}:`);
        console.error(`   Error: ${(error as Error).message}`);

        if (networkErrors.length > 0) {
          console.error(`\n🌐 Network errors detected during setup:`);
          networkErrors.forEach((err, idx) => {
            console.error(
              `   ${idx + 1}. ${err.method} ${err.url} => ${err.status} ${err.statusText}`,
            );
          });
        }

        await this.captureFailureArtifacts(page, context, user, error as Error, networkErrors);
        await browser.close();
        throw error;
      }

      await browser.close();
    }
  }
  getSpecialUser(key: SpecialUserKey): TUser {
    if (!this.specialUsers.has(key)) {
      throw new Error(`Special user not found for key: ${key}`);
    }

    const user = this.specialUsers.get(key);
    if (user === undefined) {
      throw new Error(`Special user is undefined for key: ${key}`);
    }
    return user;
  }

  public async login(user: TUser, page: Page): Promise<void> {
    await this.loginWorkerUser(user, page);
  }
}
