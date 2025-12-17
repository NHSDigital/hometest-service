import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import {
  WhiteEthnicBackground,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';

export class DetailedEthnicGroupWhitePage extends HTCPage {
  readonly englishWelshScottishRadioButton: Locator;
  readonly irishRadioButton: Locator;
  readonly gypsyIrishTravellerRadioButton: Locator;
  readonly anyOtherWhiteRadioButton: Locator;
  readonly preferNotToSayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.englishWelshScottishRadioButton = page.getByLabel(
      'English, Welsh, Scottish,'
    );
    this.irishRadioButton = page.getByLabel('Irish', { exact: true });
    this.gypsyIrishTravellerRadioButton = page.getByLabel(
      'Gypsy or Irish traveller'
    );
    this.anyOtherWhiteRadioButton = page.getByLabel('Any other White group');
    this.preferNotToSayRadioButton = page.getByLabel('Prefer not to say');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.pageHeader = page.locator(
      'h1:has-text("Which of the following best describes your White")'
    );
  }

  public async checkRadioButton(
    option: WhiteEthnicBackground | EthnicBackgroundOther
  ): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case WhiteEthnicBackground.EnglishWelshScottishNIBritish:
        radioButton = this.englishWelshScottishRadioButton;
        break;
      case WhiteEthnicBackground.Irish:
        radioButton = this.irishRadioButton;
        break;
      case WhiteEthnicBackground.GypsyOrIrishTraveller:
        radioButton = this.gypsyIrishTravellerRadioButton;
        break;
      case WhiteEthnicBackground.OtherWhiteBackground:
        radioButton = this.anyOtherWhiteRadioButton;
        break;
      case EthnicBackgroundOther.PreferNotToSay:
        radioButton = this.preferNotToSayRadioButton;
        break;
      default:
        throw new Error(`Unsupported option: ${String(option)}`);
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

  async selectDetailedEthnicWhiteGroupAndClickContinue(
    option: WhiteEthnicBackground | EthnicBackgroundOther | undefined
  ): Promise<void> {
    await this.checkRadioButton(
      option as WhiteEthnicBackground | EthnicBackgroundOther
    );
    await this.clickContinueButton();
  }
}
