import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export class CheckYourAnswersPage extends HTCPage {
  readonly changeErectileDysfunctionLink: Locator;
  readonly changeSexRecordedOnYourMedicalRecordLink: Locator;
  readonly saveContinueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);

    this.changeErectileDysfunctionLink = this.getChangeLink(
      '- has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?'
    );
    this.changeSexRecordedOnYourMedicalRecordLink = this.getChangeLink(
      'sex assigned at birth'
    );
    this.saveContinueButton = page.locator(
      'button:has-text("Save and continue")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator('h1:has-text("Check your answers")');
  }

  private getChangeLink(hiddenSpanText: string): Locator {
    return this.page.locator(`//a[span[contains(., '${hiddenSpanText}')]]`);
  }

  async clickChangeSexRecordedonYourMedicalRecordLink(): Promise<void> {
    await this.changeSexRecordedOnYourMedicalRecordLink.click();
  }

  async clickSaveContinueButton(): Promise<void> {
    await this.saveContinueButton.click();
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
    return pageTitlesMap[JourneyStepNames.CheckYourAnswersAboutYouPage];
  }
}
