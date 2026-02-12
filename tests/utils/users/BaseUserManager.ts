import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from '@playwright/test';
import type { BaseTestUser } from './BaseUser';
import { defaultUserAgent } from '../../playwright.config';

import { ConfigFactory } from '../../configuration/configuration';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseUserManager<TUser extends BaseTestUser> {
  protected readonly workerUsers: TUser[];
  private readonly numberOfWorkerUsers: number;

  protected abstract getWorkerUsers(): TUser[];
  protected abstract loginWorkerUser(user: TUser, page: Page): Promise<Page>;

  config = ConfigFactory.getConfig();

  constructor(numberOfWorkerUsers: number = 0) {
    this.numberOfWorkerUsers = numberOfWorkerUsers;

    if (numberOfWorkerUsers <= 0) {
      throw new Error('numberOfWorkerUsers must be greater than 0');
    }

    this.workerUsers = this.getWorkerUsers();

    if (numberOfWorkerUsers > this.workerUsers.length) {
      throw new Error(
        `numberOfWorkerUsers (${numberOfWorkerUsers}) exceeds available worker users (${this.workerUsers.length})`
      );
    }
  }

  getWorkerUser(index: number): TUser {
    if (index < 0 || index >= this.workerUsers.length) {
      throw new Error(`Index out of bounds: ${index}`);
    }
    return this.workerUsers[index];
  }

  getWorkerUserSessionFilePath(index: number): string {
    return `./WorkerUserSession${index}.json`;
  }

  async initializeBrowserForInitialLogin(): Promise<{
    page: Page;
    browser: Browser;
    context: BrowserContext;
  }> {
    const browser: Browser = await chromium.launch({
      headless: this.config.headless ?? true,
      timeout: 60000
    });
    const context = await browser.newContext({
      userAgent: defaultUserAgent
    });
    const page = await context.newPage();
    return { page, browser, context };
  }

  async loginWorkerUsers(): Promise<void> {
    process.env.GLOBAL_START_TIME = new Date().toISOString();
    console.log(
      `Tests will run on environment: ${process.env.ENV ?? 'local'}`
    );

    for (let i = 0; i < this.workerUsers.length; i++) {
      if (i >= this.numberOfWorkerUsers) {
        console.log(
          `Skipping login for worker user at index ${i} due to numberOfWorkerUsers limit.`
        );
        break;
      }

      console.log(this.getWorkerUserSessionFilePath(i));

      const user = this.workerUsers[i];
      const { browser, page, context } =
        await this.initializeBrowserForInitialLogin();
      if (this.config.enableTracingOnGlobalSetup) {
        await context.tracing.start({
          name: `global-setup-${uuidv4()}`,
          screenshots: true,
          snapshots: true
        });
      }
      await this.loginWorkerUser(user, page);

      await page.context().storageState({
        path: this.getWorkerUserSessionFilePath(i)
      });

      if (this.config.enableTracingOnGlobalSetup) {
        await context.tracing.stop({
          path: `testResults/global-setup-trace/global-setup-trace-${user.nhsNumber}.zip`
        });
      }
      await browser.close();
    }
  }
}
