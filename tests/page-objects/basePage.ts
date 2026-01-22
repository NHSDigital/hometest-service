import { Page, expect } from '@playwright/test'
import { config, EnvironmentVariables } from '../configuration';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page
  }

  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async waitAndFill(selector: string, text: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.fill(selector, text);
  }

  async waitAndClick(selector: string, timeout: number = 5000) {
    await this.page.getByRole('button', { name: selector }).click();
  }

  async verifyElementText(selector: string, text: string, nthIndex:number) {
    const locator = this.page.locator(selector);
    const textValue = await locator.nth(nthIndex).textContent()
    if (textValue === null) {
      throw new Error(`Element with selector "${selector}" not found or has no text content`);
    }
    return expect(textValue.trim()).toBe(text)
  }
}

