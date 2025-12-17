import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { EthnicBackground } from '@dnhc-health-checks/shared';

export class EthnicGroupPage extends HTCPage {
  readonly asianRadioButton: Locator;
  readonly blackRadioButton: Locator;
  readonly mixedEthnicRadioButton: Locator;
  readonly whiteRadioButton: Locator;
  readonly otherEthnicRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly selectYourEthnicGroupErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.asianRadioButton = page.locator('#ethnicity-1');
    this.blackRadioButton = page.locator('#ethnicity-2');
    this.mixedEthnicRadioButton = page.locator('#ethnicity-3');
    this.whiteRadioButton = page.locator('#ethnicity-4');
    this.otherEthnicRadioButton = page.locator('#ethnicity-5');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator('h1:has-text("What is your ethnic group?")');
    this.selectYourEthnicGroupErrorLink = page.getByRole('link', {
      name: 'Select your ethnic group'
    });
    this.errorMessage = page.getByText('Error: Select your ethnic group');
  }

  async checkRadioButton(option: EthnicBackground): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case EthnicBackground.AsianOrAsianBritish:
        radioButton = this.asianRadioButton;
        break;
      case EthnicBackground.BlackAfricanCaribbeanOrBlackBritish:
        radioButton = this.blackRadioButton;
        break;
      case EthnicBackground.MixedOrMultipleGroups:
        radioButton = this.mixedEthnicRadioButton;
        break;
      case EthnicBackground.White:
        radioButton = this.whiteRadioButton;
        break;
      case EthnicBackground.Other:
        radioButton = this.otherEthnicRadioButton;
        break;
      default:
        throw new Error('Unsupported option');
    }
    await radioButton.click();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async selectEthnicAndClickContinueButton(
    option: EthnicBackground
  ): Promise<void> {
    await this.checkRadioButton(option);
    await this.clickContinueButton();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.EthnicGroupPage];
  }
}
