import { Page, Locator } from '@playwright/test';
import { config, Configuration, EnvironmentVariables } from '../configuration';
import { BasePage } from './basePage';

const passwordInput = "[name='password']";
const continueBtn = "Continue";
const StartNowBtn = "Start Now";

export class WPHomePage extends BasePage {

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
    await this.waitAndFill(passwordInput, 'nhs-home-testing');
    await this.waitAndClick(continueBtn);
  }

  async contentAssertions(selector: string, expectedText: string, nthIndex: number): Promise<void> {
    await this.verifyElementText(selector, expectedText, nthIndex);
  }

  async clickStartNowButton(): Promise<void> {
    await this.waitAndClick(StartNowBtn);
  }
}
