import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

interface Selectors {
  backLink: Locator;
  centimetresInputField: Locator;
  inchesInputField: Locator;
  waistMeasurementSwitchLink: Locator;
  continueButton: Locator;
  pageHeader: Locator;
  centimetresOption: Locator;
  inchesOption: Locator;
  errorMessage: Locator;
}

export class WhatIsYourWaistMeasurementPage extends HTCPage {
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);

    this.selectors = {
      backLink: this.page.getByRole('link', { name: 'Back' }),
      centimetresInputField: this.page.locator('#waist-measurement-cm'),
      inchesInputField: this.page.locator('#waist-measurement-in'),
      waistMeasurementSwitchLink: this.page.locator(
        '#waist-measurement-switch-link'
      ),
      continueButton: this.page.locator('button:has-text("Continue")'),
      pageHeader: this.page.locator(
        'h1:has-text("What is your waist measurement?")'
      ),
      centimetresOption: this.page.locator('#waist-measurement-cm--label'),
      inchesOption: this.page.locator('#waist-measurement-in--label'),
      errorMessage: this.page.locator('#waist-measurement-error')
    };
  }

  async clickBackLink(): Promise<void> {
    await this.selectors.backLink.click();
  }

  private async switchToCentimetres(): Promise<void> {
    if (!(await this.selectors.centimetresOption.isVisible())) {
      await this.selectors.waistMeasurementSwitchLink.click();
    }
  }

  private async switchToInches(): Promise<void> {
    if (!(await this.selectors.inchesOption.isVisible())) {
      await this.selectors.waistMeasurementSwitchLink.click();
    }
  }

  async inputValueInCentimetres(value: string): Promise<void> {
    await this.switchToCentimetres();
    await this.selectors.centimetresInputField.fill(value);
  }

  async inputValueInInches(value: string): Promise<void> {
    await this.switchToInches();
    await this.selectors.inchesInputField.fill(value);
  }

  async clickContinueButton(): Promise<void> {
    await this.selectors.continueButton.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.selectors.pageHeader.textContent();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.selectors.pageHeader.waitFor();
  }

  getErrorMessageLink(message: string): Locator {
    return this.page.getByRole('link', { name: message });
  }

  async getErrorMessageText(): Promise<string | null> {
    const text = await this.selectors.errorMessage.textContent();
    return text ? text.replace('Error: ', '') : null;
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.WaistMeasurementPage];
  }
}
