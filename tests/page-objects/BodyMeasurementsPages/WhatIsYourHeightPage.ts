import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

const HeightLimits = {
  inFeetAndInches: {
    min: { ft: 4, inch: 7 },
    max: { ft: 8, inch: 0 }
  },
  inInches: {
    min: 0,
    max: 11
  },
  inCentimetres: {
    min: 139.7,
    max: 243.8
  }
};

export const ErrorMessagesForHeight = {
  BlankField: 'Enter your height',
  LimitValuesCentimetres: `Height must be between ${HeightLimits.inCentimetres.min}cm and ${HeightLimits.inCentimetres.max}cm`,
  LimitValuesFeetAndInches: `Height must be between ${HeightLimits.inFeetAndInches.min.ft} feet ${HeightLimits.inFeetAndInches.min.inch} inches and ${HeightLimits.inFeetAndInches.max.ft} feet`,
  LimitValuesFeet: `Feet must be between ${HeightLimits.inFeetAndInches.min.ft} and ${HeightLimits.inFeetAndInches.max.ft}`,
  LimitValuesInches: `Inches must be between ${HeightLimits.inInches.min} and ${HeightLimits.inInches.max}`,
  FeetWholeNumbers: 'Feet must be in whole numbers',
  InchesWholeNumbers: 'Inches must be in whole numbers'
};

interface Selectors {
  backLink: Locator;
  centimetresInputField: Locator;
  feetInputField: Locator;
  inchesInputField: Locator;
  heightSwitchLink: Locator;
  continueButton: Locator;
  pageHeader: Locator;
  centimetresOption: Locator;
  feetOption: Locator;
  errorMessage: Locator;
}

export class WhatIsYourHeightPage extends HTCPage {
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);

    this.selectors = {
      backLink: this.page.getByRole('link', { name: 'Back' }),
      centimetresInputField: this.page.locator('#cm'),
      feetInputField: this.page.locator('#feet'),
      inchesInputField: this.page.locator('#inches'),
      heightSwitchLink: this.page.locator('#height-switch-link'),
      continueButton: this.page.locator('button:has-text("Continue")'),
      pageHeader: this.page.locator('h1:has-text("Enter your height")'),
      centimetresOption: this.page.locator('#cm--label'),
      feetOption: this.page.locator('#feet--label'),
      errorMessage: this.page.locator('#height-error')
    };
  }

  async clickBackLink(): Promise<void> {
    await this.selectors.backLink.click();
  }

  private async switchToCentimetres(): Promise<void> {
    if (!(await this.selectors.centimetresOption.isVisible())) {
      await this.selectors.heightSwitchLink.click();
    }
  }

  private async switchToFeetAndInches(): Promise<void> {
    if (!(await this.selectors.feetOption.isVisible())) {
      await this.selectors.heightSwitchLink.click();
    }
  }

  async inputValueInCentimetres(value: string): Promise<void> {
    await this.switchToCentimetres();
    await this.selectors.centimetresInputField.clear();
    await this.selectors.centimetresInputField.fill(value);
  }

  async inputValueInFeetAndInches(feet: string, inches: string): Promise<void> {
    await this.switchToFeetAndInches();
    await this.selectors.feetInputField.clear();
    await this.selectors.inchesInputField.clear();
    await this.selectors.feetInputField.fill(feet);
    await this.selectors.inchesInputField.fill(inches);
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
    return pageTitlesMap[JourneyStepNames.HeightPage];
  }
}
