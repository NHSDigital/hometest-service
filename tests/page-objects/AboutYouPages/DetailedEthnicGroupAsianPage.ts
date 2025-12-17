import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import {
  AsianOrAsianBritish,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';

export class DetailedEthnicGroupAsianPage extends HTCPage {
  readonly bangladeshiRadioButton: Locator;
  readonly chineseRadioButton: Locator;
  readonly indianRadioButton: Locator;
  readonly pakistaniRadioButton: Locator;
  readonly anyOtherAsianRadioButton: Locator;
  readonly preferNotToSayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly pageHeader: Locator;
  readonly selectYourBackgroundErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.bangladeshiRadioButton = page.getByLabel('Bangladeshi');
    this.chineseRadioButton = page.getByLabel('Chinese');
    this.indianRadioButton = page.getByLabel('Indian');
    this.pakistaniRadioButton = page.getByLabel('Pakistani');
    this.anyOtherAsianRadioButton = page.getByLabel('Any other Asian group');
    this.preferNotToSayRadioButton = page.getByLabel('Prefer not to say');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.pageHeader = page.locator(
      'h1:has-text("Which of the following best describes your Asian")'
    );
    this.selectYourBackgroundErrorLink = page.getByRole('link', {
      name: "Select your Asian or Asian British background or 'Prefer not to say'"
    });
    this.errorMessage = page.getByText(
      'Error: Select your Asian or Asian British'
    );
  }

  public async checkRadioButton(
    option: AsianOrAsianBritish | EthnicBackgroundOther
  ): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case AsianOrAsianBritish.Bangladeshi:
        radioButton = this.bangladeshiRadioButton;
        break;
      case AsianOrAsianBritish.Chinese:
        radioButton = this.chineseRadioButton;
        break;
      case AsianOrAsianBritish.Indian:
        radioButton = this.indianRadioButton;
        break;
      case AsianOrAsianBritish.Pakistani:
        radioButton = this.pakistaniRadioButton;
        break;
      case AsianOrAsianBritish.OtherAsianBackground:
        radioButton = this.anyOtherAsianRadioButton;
        break;
      case EthnicBackgroundOther.PreferNotToSay:
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

  async selectDetailedEthnicAsianGroupAndClickContinue(
    option: AsianOrAsianBritish | EthnicBackgroundOther | undefined
  ): Promise<void> {
    await this.checkRadioButton(
      option as AsianOrAsianBritish | EthnicBackgroundOther
    );
    await this.clickContinueButton();
  }
}
