import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum EthnicGroupBlack {
  African = 'African',
  Caribbean = 'Caribbean',
  AnyOtherBlack = 'Any other Black, African, or',
  PreferNotToSay = 'Prefer not to say'
}

export class DetailedEthnicGroupBlackPage extends HTCPage {
  readonly africanRadioButton: Locator;
  readonly caribbeanRadioButton: Locator;
  readonly anyOtherRadioBlackButton: Locator;
  readonly preferNotToSayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.africanRadioButton = page.getByLabel('African', { exact: true });
    this.caribbeanRadioButton = page.getByLabel('Caribbean', { exact: true });
    this.anyOtherRadioBlackButton = page.getByLabel(
      'Any other Black, African, or'
    );
    this.preferNotToSayRadioButton = page.getByLabel('Prefer not to say');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.pageHeader = page.locator(
      'h1:has-text("Which of the following best describes your Black")'
    );
  }

  public async checkRadioButton(option: EthnicGroupBlack): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case EthnicGroupBlack.African:
        radioButton = this.africanRadioButton;
        break;
      case EthnicGroupBlack.Caribbean:
        radioButton = this.caribbeanRadioButton;
        break;
      case EthnicGroupBlack.AnyOtherBlack:
        radioButton = this.anyOtherRadioBlackButton;
        break;
      case EthnicGroupBlack.PreferNotToSay:
        radioButton = this.preferNotToSayRadioButton;
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Unsupported option: ${option}`);
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
