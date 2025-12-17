import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import {
  EthnicBackgroundOther,
  OtherEthnicity
} from '@dnhc-health-checks/shared/model/enum/health-check-answers';

export class DetailedOtherEthnicGroupPage extends HTCPage {
  readonly arabRadioButton: Locator;
  readonly anyOtherEthnicRadioButton: Locator;
  readonly preferNotToSayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.arabRadioButton = page.getByLabel('Arab');
    this.anyOtherEthnicRadioButton = page.getByLabel('Any other ethnic group');
    this.preferNotToSayRadioButton = page.getByLabel('Prefer not to say');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.pageHeader = page.locator(
      'h1:has-text("Which of the following best describes your ethnic group?")'
    );
  }

  public async checkRadioButton(
    option: OtherEthnicity | EthnicBackgroundOther
  ): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case OtherEthnicity.Arab:
        radioButton = this.arabRadioButton;
        break;
      case OtherEthnicity.OtherEthnicGroup:
        radioButton = this.anyOtherEthnicRadioButton;
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

  async selectDetailedEthnicOtherGroupAndClickContinue(
    option: OtherEthnicity | EthnicBackgroundOther | undefined
  ): Promise<void> {
    await this.checkRadioButton(
      option as OtherEthnicity | EthnicBackgroundOther
    );
    await this.clickContinueButton();
  }
}
