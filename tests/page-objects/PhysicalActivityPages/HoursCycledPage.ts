import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum CycleOptions {
  NONE = 'None',
  LESS_THAN_ONE_HOUR = 'Less than 1 hour',
  MORE_THAN_ONE_LESS_THAN_THREE = 'More than 1 hour, but less than 3',
  THREE_OR_MORE = '3 hours or more'
}

export class HoursCycledPage extends HTCPage {
  readonly noneRadio: Locator;
  readonly LessThanOneRadio: Locator;
  readonly MoreThanOneLessThanThreeRadio: Locator;
  readonly ThreeOrMoreRadio: Locator;
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.noneRadio = page
      .locator('div')
      .filter({ hasText: /^None$/ })
      .getByRole('radio');
    this.LessThanOneRadio = page
      .locator('div')
      .filter({ hasText: /^Less than 1 hour$/ })
      .getByRole('radio');
    this.MoreThanOneLessThanThreeRadio = page
      .locator('div')
      .filter({ hasText: /^More than 1 hour, but less than 3$/ })
      .getByRole('radio');
    this.ThreeOrMoreRadio = page
      .locator('div')
      .filter({ hasText: /^3 hours or more$/ })
      .getByRole('radio');
    this.pageHeader = page.locator(
      'h1:has-text("How many hours do you cycle in a typical week?")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    const errorText = 'Select how many hours you cycled last week';
    this.selectionErrorLink = page.getByRole('link', {
      name: errorText
    });
    this.errorMessage = page.getByText('Error: ' + errorText);
  }

  async selectCycleHoursOptions(selection: CycleOptions): Promise<void> {
    switch (selection) {
      case CycleOptions.NONE:
        await this.noneRadio.check();
        break;

      case CycleOptions.LESS_THAN_ONE_HOUR:
        await this.LessThanOneRadio.check();
        break;
      case CycleOptions.MORE_THAN_ONE_LESS_THAN_THREE:
        await this.MoreThanOneLessThanThreeRadio.check();
        break;
      case CycleOptions.THREE_OR_MORE:
        await this.ThreeOrMoreRadio.check();
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

  async selectCycleOptionsAndClickContinue(
    selection: CycleOptions
  ): Promise<void> {
    await this.selectCycleHoursOptions(selection);
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.HoursCycledPage];
  }
}
