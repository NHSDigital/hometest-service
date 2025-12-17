import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum EthnicGroupMixed {
  WhiteAsian = 'White and Asian',
  WhiteBlackAfrican = 'White and Black African',
  WhiteBlackCaribbean = 'White and Black Caribbean',
  AnyOtherMixed = 'Any other Mixed or multiple',
  PreferNotToSay = 'Prefer not to say'
}

export class DetailedEthnicGroupMixedEthnicPage extends HTCPage {
  readonly whiteAsianRadioButton: Locator;
  readonly whiteBlackAfricanRadioButton: Locator;
  readonly whiteBlackCaribbeanRadioButton: Locator;
  readonly anyOtherMixedEthnicRadioButton: Locator;
  readonly preferNotToSayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.whiteAsianRadioButton = page.getByLabel('White and Asian');
    this.whiteBlackAfricanRadioButton = page.getByLabel(
      'White and Black African'
    );
    this.whiteBlackCaribbeanRadioButton = page.getByLabel(
      'White and Black Caribbean'
    );
    this.anyOtherMixedEthnicRadioButton = page.getByLabel(
      'Any other Mixed or multiple'
    );
    this.preferNotToSayRadioButton = page.getByLabel('Prefer not to say');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.pageHeader = page.locator(
      'h1:has-text("Which of the following best describes your Mixed")'
    );
  }

  public async checkRadioButton(option: EthnicGroupMixed): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case EthnicGroupMixed.WhiteAsian:
        radioButton = this.whiteAsianRadioButton;
        break;
      case EthnicGroupMixed.WhiteBlackAfrican:
        radioButton = this.whiteBlackAfricanRadioButton;
        break;
      case EthnicGroupMixed.WhiteBlackCaribbean:
        radioButton = this.whiteBlackCaribbeanRadioButton;
        break;
      case EthnicGroupMixed.AnyOtherMixed:
        radioButton = this.anyOtherMixedEthnicRadioButton;
        break;
      case EthnicGroupMixed.PreferNotToSay:
        radioButton = this.preferNotToSayRadioButton;
        break;
      default:
        throw new Error('Unsupported option');
    }
    await radioButton.check(); // Ensure the radio button is checked
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
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
    return pageTitlesMap[JourneyStepNames.DescribeEthnicBackgroundPage];
  }
}
