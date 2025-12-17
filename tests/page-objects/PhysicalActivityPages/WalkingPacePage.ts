import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum WalkingPaceOptions {
  SLOW = 'Slow pace',
  STEADY_AVERAGE = 'Average pace',
  BRISK = 'Brisk pace',
  FAST = 'Fast pace'
}

export class WalkingPacePage extends HTCPage {
  readonly slowRadio: Locator;
  readonly steadyAverageRadio: Locator;
  readonly briskRadio: Locator;
  readonly fastRadio: Locator;
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.slowRadio = page.locator('#walking-pace-1');
    this.steadyAverageRadio = page.locator('#walking-pace-2');
    this.briskRadio = page.locator('#walking-pace-3');
    this.fastRadio = page.locator('#walking-pace-4');
    this.pageHeader = page.locator(
      'h1:has-text("How would you describe your usual walking pace? (optional)")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    const errorText = 'Select how you would describe your usual walking pace';
    this.selectionErrorLink = page.getByRole('link', {
      name: errorText
    });
    this.errorMessage = page.getByText('Error: ' + errorText);
  }

  async selectWalkingPaceOptions(selection: WalkingPaceOptions): Promise<void> {
    switch (selection) {
      case WalkingPaceOptions.SLOW:
        await this.slowRadio.check();
        break;

      case WalkingPaceOptions.STEADY_AVERAGE:
        await this.steadyAverageRadio.check();
        break;
      case WalkingPaceOptions.BRISK:
        await this.briskRadio.check();
        break;
      case WalkingPaceOptions.FAST:
        await this.fastRadio.check();
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

  async selectWalkingPaceOptionsAndClickContinue(
    selection?: WalkingPaceOptions
  ): Promise<void> {
    if (selection !== null && selection !== undefined) {
      await this.selectWalkingPaceOptions(selection);
    }
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.WalkingPacePage];
  }
}
