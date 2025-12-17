import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum WorkActivityOptions {
  UNEMPLOYED = 'Unemployed',
  SITTING = 'Sitting',
  PHYSICAL_LIGHT = 'PhysicalLight',
  PHYSICAL_MEDIUM = 'PhysicalMedium',
  PHYSICAL_HEAVY = 'PhysicalHeavy'
}

export class WorkActivityPage extends HTCPage {
  readonly unemployedRadio: Locator;
  readonly sittingRadio: Locator;
  readonly PhysicalLightRadio: Locator;
  readonly PhysicalMediumRadio: Locator;
  readonly PhysicalHeavyRadio: Locator;
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.unemployedRadio = page.locator('#work-activity-1');
    this.sittingRadio = page.locator('#work-activity-2');
    this.PhysicalLightRadio = page.locator('#work-activity-3');
    this.PhysicalMediumRadio = page.locator('#work-activity-4');
    this.PhysicalHeavyRadio = page.locator('#work-activity-5');
    this.pageHeader = page.locator(
      'h1:has-text("How active are you in your work?")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    const errorText = 'Select how active you are in your work';
    this.selectionErrorLink = page.getByRole('link', {
      name: errorText
    });
    this.errorMessage = page.getByText('Error: ' + errorText);
  }

  async selectWorkActivityOptions(
    selection: WorkActivityOptions
  ): Promise<void> {
    switch (selection) {
      case WorkActivityOptions.UNEMPLOYED:
        await this.unemployedRadio.check();
        break;

      case WorkActivityOptions.SITTING:
        await this.sittingRadio.check();
        break;
      case WorkActivityOptions.PHYSICAL_LIGHT:
        await this.PhysicalLightRadio.check();
        break;
      case WorkActivityOptions.PHYSICAL_MEDIUM:
        await this.PhysicalMediumRadio.check();
        break;
      case WorkActivityOptions.PHYSICAL_HEAVY:
        await this.PhysicalHeavyRadio.check();
        break;
    }
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
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

  async selectWorkActivityOptionsAndClickContinue(
    selection: WorkActivityOptions
  ): Promise<void> {
    await this.selectWorkActivityOptions(selection);
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.WorkActivityPage];
  }
}
