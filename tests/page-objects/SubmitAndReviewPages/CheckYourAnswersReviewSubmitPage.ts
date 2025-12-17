import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap, RoutePath } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class CheckYourAnswersReviewSubmitPage extends HTCPage {
  readonly submitButton: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.getByRole('button', {
      name: 'Submit'
    });
    this.pageHeader = page.locator('h3:has-text("Important")');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  private readonly changeQuestionSelectorMap: Partial<
    Record<JourneyStepNames, () => Locator>
  > = {
    [JourneyStepNames.HoursGardeningPage]: () =>
      this.page
        .locator('#gardening-hours-changeLink')
        .getByRole('link', { name: 'Change' }),
    [JourneyStepNames.WeightPage]: () =>
      this.page
        .locator('#weight-changeLink')
        .getByRole('link', { name: 'Change' })
  };

  private readonly questionValueMap: Partial<
    Record<JourneyStepNames, () => Locator>
  > = {
    [JourneyStepNames.HoursGardeningPage]: () =>
      this.page.locator('#gardening-hours-value'),
    [JourneyStepNames.WeightPage]: () => this.page.locator('#weight-value')
  };

  async clickBackLink(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async clickChangeLink(answerToChange: JourneyStepNames): Promise<void> {
    const locator = this.changeQuestionSelectorMap[answerToChange]?.();
    await locator?.click();
  }

  async getAnswerValue(
    answerToChange: JourneyStepNames
  ): Promise<string | null> {
    const locator = this.questionValueMap[answerToChange]?.();
    return (await locator?.textContent()) ?? '';
  }

  async clickSubmitButton(): Promise<void> {
    await this.submitButton.waitFor();
    await this.submitButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.CheckAndSubmitYourAnswersPage];
  }
}
