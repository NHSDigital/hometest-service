import { Page, Locator, expect } from '@playwright/test';
import { config, Configuration, EnvironmentVariables } from '../configuration';
import { BasePage } from './basePage';


const passwordInput = "[name='password']";
const continueBtn = "Continue";
const StartNowBtn = "Start Now";
export class HomeTestPage extends BasePage {

  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async navigateOrderJourney(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_ORDER_JOURNEY_URL));
  }


  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async verifyPageLoaded(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded');
    return true;
  }

  async enterPassword(): Promise<void> {
    await this.page.fill(passwordInput, 'nhs-home-testing');
    await this.page.getByRole('button', { name: continueBtn }).click();

  }

  async contentAssertions(expectedText: string): Promise<void> {
    const actualText = this.page.locator("h1");
    await expect(actualText).toHaveText(expectedText)
  }

  async clickStartNowButton(): Promise<void> {
    await this.page.getByRole('button', { name: StartNowBtn }).click();
  }
}
