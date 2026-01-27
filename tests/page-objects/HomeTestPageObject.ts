import { Page, Locator, expect } from '@playwright/test';
import { config, Configuration, EnvironmentVariables } from '../configuration';


const passwordInput = "[name='password']";
const continueBtn = "Continue";
const StartNowBtn = "Start Now";
const header1 = "h1";
export class HomeTestPage  {
readonly page: Page;

  constructor(page: Page) {
    this.page = page
  }
  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForPageLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getText(): Promise<string[]> {
    return await this.page.locator(header1).allTextContents();
  }

  async clickStartNowButton(): Promise<void> {
    await this.page.getByRole('button', { name: StartNowBtn }).click();
  }
}
