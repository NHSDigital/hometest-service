import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../../env/config';
import { pageTitlesMap, RoutePath } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class TermsAndConditionsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly config: Config;
  readonly iHaveReadAndAcceptTheTermsAndConditionBox: Locator;
  readonly acceptAndContinueButton: Locator;
  readonly termsAndConditionErrorLink: Locator;
  readonly termsAndConditionErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Accept terms of use")');
    this.config = ConfigFactory.getConfig();
    this.iHaveReadAndAcceptTheTermsAndConditionBox = page.locator(
      '#terms-and-conditions-1'
    );
    this.acceptAndContinueButton = page.locator('button:has-text("Continue")');
    this.termsAndConditionErrorLink = page.getByRole('link', {
      name: 'Select if you have read and agree to the terms of use'
    });
    this.termsAndConditionErrorMessage = page.locator(
      '#terms-and-conditions--error-message'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.iHaveReadAndAcceptTheTermsAndConditionBox.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async checkIHaveReadAndAcceptTheTermsAndConditionBox(): Promise<void> {
    await this.iHaveReadAndAcceptTheTermsAndConditionBox.check();
  }

  async clickAcceptAndContinueButton(): Promise<void> {
    await this.acceptAndContinueButton.click();
  }

  async checkAcceptTermsBoxAndClickAcceptAndContinueButton(): Promise<void> {
    await this.checkIHaveReadAndAcceptTheTermsAndConditionBox();
    await this.clickAcceptAndContinueButton();
  }

  async getTermsAndConditionsErrorMessageText(): Promise<string | null> {
    return await this.termsAndConditionErrorMessage.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.TermsAndConditions];
  }
}
