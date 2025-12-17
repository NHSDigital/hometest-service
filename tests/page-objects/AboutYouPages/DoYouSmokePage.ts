import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { Smoking } from '@dnhc-health-checks/shared';

export class DoYouSmokePage extends HTCPage {
  readonly noIHaveNeverSmokedRadioButton: Locator;
  readonly noIQuitSmokingRadioButton: Locator;
  readonly yesISmokeUpTo10CigarettesADayRadioButton: Locator;
  readonly yesISmoke11To20CigarettesADayRadioButton: Locator;
  readonly yesISmokeMoreThan20CigarettesADayRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly selectSmokeErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.noIHaveNeverSmokedRadioButton = page.locator('#smoking-1--label');
    this.noIQuitSmokingRadioButton = page.locator('#smoking-2--label');
    this.yesISmokeUpTo10CigarettesADayRadioButton =
      page.locator('#smoking-3--label');
    this.yesISmoke11To20CigarettesADayRadioButton =
      page.locator('#smoking-4--label');
    this.yesISmokeMoreThan20CigarettesADayRadioButton =
      page.locator('#smoking-5--label');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator('h1:has-text("Do you smoke?")');
    this.selectSmokeErrorLink = page.getByRole('link', {
      name: 'Select if you smoke'
    });
    this.errorMessage = page.getByText('Error: Select if you smoke');
  }

  async clickNoIHaveNeverSmokedRadioButton(): Promise<void> {
    await this.noIHaveNeverSmokedRadioButton.check();
  }

  async clickNoIQuitSmokingRadioButton(): Promise<void> {
    await this.noIQuitSmokingRadioButton.check();
  }

  async clickYesISmokeUpTo10CigarettesADayRadioButton(): Promise<void> {
    await this.yesISmokeUpTo10CigarettesADayRadioButton.check();
  }

  async clickYesISmoke11To20CigarettesADayRadioButton(): Promise<void> {
    await this.yesISmoke11To20CigarettesADayRadioButton.check();
  }

  async clickYesISmokeMoreThan20CigarettesADayRadioButton(): Promise<void> {
    await this.yesISmokeMoreThan20CigarettesADayRadioButton.check();
  }

  public async selectSmokingOption(option: Smoking): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case Smoking.Never:
        radioButton = this.noIHaveNeverSmokedRadioButton;
        break;
      case Smoking.Quitted:
        radioButton = this.noIQuitSmokingRadioButton;
        break;
      case Smoking.UpToNinePerDay:
        radioButton = this.yesISmokeUpTo10CigarettesADayRadioButton;
        break;
      case Smoking.TenToNineteenPerDay:
        radioButton = this.yesISmoke11To20CigarettesADayRadioButton;
        break;
      case Smoking.TwentyOrMorePerDay:
        radioButton = this.yesISmokeMoreThan20CigarettesADayRadioButton;
        break;
      default:
        throw new Error('Unsupported option');
    }
    await radioButton.check(); // Ensure the radio button is checked
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  public async selectSmokingOptionAndClickContinue(
    option: Smoking
  ): Promise<void> {
    await this.selectSmokingOption(option);
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
    return pageTitlesMap[JourneyStepNames.SmokingQuestionPage];
  }
}
