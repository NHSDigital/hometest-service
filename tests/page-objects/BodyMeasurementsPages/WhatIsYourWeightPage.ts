import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

const WeightMeasurementLimits = {
  inStones: {
    min: 4,
    max: 50
  },
  pounds: {
    min: 0,
    max: 13
  },
  kg: {
    min: 25.4,
    max: 317.5
  }
};

export const ErrorMessagesForWeight = {
  BlankField: 'Enter your weight',
  LimitValuesKilograms: `Weight must be between ${WeightMeasurementLimits.kg.min}kg and ${WeightMeasurementLimits.kg.max}kg`,
  LimitValuesStones: `Weight must be between ${WeightMeasurementLimits.inStones.min} stone and ${WeightMeasurementLimits.inStones.max} stone`,
  LimitValuesPounds: `Pounds must be between ${WeightMeasurementLimits.pounds.min} and ${WeightMeasurementLimits.pounds.max}`,
  StonesWholeNumbers: 'Stone must be in whole numbers',
  PoundsWholeNumbers: 'Pounds must be in whole numbers'
};

interface Selectors {
  backLink: Locator;
  kilogramsInputField: Locator;
  stonesInputField: Locator;
  poundsInputField: Locator;
  weightSwitchLink: Locator;
  continueButton: Locator;
  pageHeader: Locator;
  kilogramsOption: Locator;
  stonesOption: Locator;
  poundsOption: Locator;
  errorMessage: Locator;
}

export class WhatIsYourWeightPage extends HTCPage {
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);

    this.selectors = {
      backLink: this.page.getByRole('link', { name: 'Back' }),
      kilogramsInputField: this.page.locator('#weight-kg'),
      stonesInputField: this.page.locator('#weight-stone'),
      poundsInputField: this.page.locator('#weight-pounds'),
      weightSwitchLink: this.page.locator('#weight-switch-link'),
      continueButton: this.page.locator('button:has-text("Continue")'),
      pageHeader: this.page.locator('h1:has-text("Enter your weight")'),
      kilogramsOption: this.page.locator('#weight-kg--label'),
      stonesOption: this.page.locator('#weight-stone--label'),
      poundsOption: this.page.locator('#weight-pounds--label'),
      errorMessage: this.page.locator('#weight-error')
    };
  }

  async inputValueInKilograms(value: string): Promise<void> {
    if (await this.selectors.kilogramsOption.isVisible()) {
      await this.selectors.kilogramsInputField.fill(value);
    } else {
      await this.selectors.weightSwitchLink.click();
      await this.selectors.kilogramsOption.isVisible();
      await this.selectors.kilogramsInputField.fill(value);
    }
  }

  async inputValueInStonesAndPounds(
    stones: string,
    pounds: string
  ): Promise<void> {
    if (await this.selectors.stonesOption.isVisible()) {
      await this.selectors.stonesInputField.fill(stones);
      await this.selectors.poundsInputField.fill(pounds);
    } else {
      await this.selectors.weightSwitchLink.click();
      await this.selectors.stonesOption.isVisible();
      await this.selectors.stonesInputField.fill(stones);
      await this.selectors.poundsInputField.fill(pounds);
    }
  }

  async clickBackLink(): Promise<void> {
    await this.selectors.backLink.click();
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
    return pageTitlesMap[JourneyStepNames.WeightPage];
  }
}
