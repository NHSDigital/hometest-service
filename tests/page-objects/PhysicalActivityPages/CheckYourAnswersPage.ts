import { type ElementHandle, type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class CheckYourAnswersPage extends HTCPage {
  readonly changeHoursExerciseLink: Locator;
  readonly changeHoursWalkLink: Locator;
  readonly changeHoursCycleLink: Locator;
  readonly changeWorkActivityLink: Locator;
  readonly changeHoursHouseworkLink: Locator;
  readonly changehoursGardeningLink: Locator;
  readonly changeWalkPaceLink: Locator;
  readonly saveContinueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.changeHoursExerciseLink = page
      .locator('#maincontent div')
      .filter({ hasText: 'How many hours do you exercise per week?' })
      .getByRole('link');
    this.changeHoursWalkLink = page
      .locator('div')
      .filter({ hasText: 'How many hours do you walk per week?' })
      .getByRole('link');
    this.changeHoursCycleLink = page
      .locator('div')
      .filter({ hasText: 'How many hours do you cycle per week?' })
      .getByRole('link');
    this.changeWorkActivityLink = page
      .locator('div')
      .filter({ hasText: 'How active are you in your work?' })
      .getByRole('link');
    this.changeHoursHouseworkLink = page
      .locator('div')
      .filter({
        hasText:
          'How many hours do you spend on housework or childcare per week?'
      })
      .getByRole('link');
    this.changehoursGardeningLink = page
      .locator('div')
      .filter({
        hasText: 'How many hours do you spend on gardening or DIY per week?'
      })
      .getByRole('link');
    this.changeWalkPaceLink = page
      .locator('div')
      .filter({
        hasText: 'How would you describe your usual walking pace'
      })
      .getByRole('link');
    this.saveContinueButton = page.locator(
      'button:has-text("Save and continue")'
    );
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator('h1:has-text("Check your answers")');
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

  async clickLink(linkElement: ElementHandle): Promise<void> {
    await linkElement.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.CheckYourAnswersPagePhysicalActivity];
  }
}
