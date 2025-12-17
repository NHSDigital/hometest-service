import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { Sex } from '@dnhc-health-checks/shared';

export class SexAssignedAtBirthPage extends HTCPage {
  readonly femaleRadioButton: Locator;
  readonly maleRadioButton: Locator;
  readonly whyDoWeAskThisText: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly selectYourSexErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.femaleRadioButton = page.locator('#sex-assigned-at-birth-1');
    this.maleRadioButton = page.locator('#sex-assigned-at-birth-2');
    this.whyDoWeAskThisText = page.getByText('Why do we ask this?');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator(
      'h1:has-text("What is your sex assigned at birth")'
    );
    this.selectYourSexErrorLink = page.getByRole('link', {
      name: 'Select your sex assigned at birth'
    });
    this.errorMessage = page.getByText(
      'Error: Select your sex assigned at birth'
    );
  }

  async checkFemaleRadioButton(): Promise<void> {
    await this.femaleRadioButton.click();
  }

  async checkMaleRadioButton(): Promise<void> {
    await this.maleRadioButton.click();
  }

  async clickWhyDoWeAskThisText(): Promise<void> {
    await this.whyDoWeAskThisText.click();
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
    return pageTitlesMap[JourneyStepNames.SexAssignedAtBirthPage];
  }

  async selectSexOptions(selection: Sex): Promise<void> {
    switch (selection) {
      case Sex.Male:
        await this.maleRadioButton.check();
        break;
      case Sex.Female:
        await this.femaleRadioButton.check();
        break;
    }
  }
  async selectSexAssignedAtBirthOptionsAndClickContinue(
    selection: Sex
  ): Promise<void> {
    await this.selectSexOptions(selection);
    await this.clickContinueButton();
  }
}
