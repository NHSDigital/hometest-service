import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class CheckYourAnswersPage extends HTCPage {
  readonly changeDoYouDrinkAlcoholLink: Locator;
  readonly changeHowOftenDoYouHaveDrinkLink: Locator;
  readonly changeOnTypicalDayWhenYouDrinkAlcoholLink: Locator;
  readonly changeOnHowOftenHaveYouHadSixOrMoreAlcoholUnitsLink: Locator;
  readonly changeUnableToStopDrinkingLink: Locator;
  readonly changeFailedToDoWhatWasExpectedLink: Locator;
  readonly changeMorningAlcoholLink: Locator;
  readonly changeFeltGuiltyLink: Locator;
  readonly changeMemoryLossLink: Locator;
  readonly changeAlcoholInjuredLink: Locator;
  readonly changeRelativeConcernedLink: Locator;
  readonly saveContinueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.changeDoYouDrinkAlcoholLink = page
      .locator('div')
      .filter({ hasText: 'Do you drink alcohol' })
      .getByRole('link');
    this.changeHowOftenDoYouHaveDrinkLink = page
      .locator('div')
      .filter({ hasText: 'How often do you have a drink containing alcohol' })
      .getByRole('link');
    this.changeOnTypicalDayWhenYouDrinkAlcoholLink = page
      .locator('div')
      .filter({ hasText: 'On a typical day when you drink alcohol' })
      .getByRole('link');
    this.changeOnHowOftenHaveYouHadSixOrMoreAlcoholUnitsLink = page
      .locator('#maincontent div')
      .filter({ hasText: 'how often have you had 6 or more alcohol units' })
      .getByRole('link');
    this.changeUnableToStopDrinkingLink = page
      .locator('#maincontent div')
      .filter({
        hasText:
          'In the past year, how often have you found that you were not able to stop'
      })
      .getByRole('link');
    this.changeFailedToDoWhatWasExpectedLink = page
      .locator('#maincontent div')
      .filter({
        hasText:
          'In the past year, how often have you failed to do what was expected of you '
      })
      .getByRole('link');
    this.changeMorningAlcoholLink = page
      .locator('#maincontent div')
      .filter({
        hasText:
          'In the past year, how often have you needed an alcoholic drink in the morning '
      })
      .getByRole('link');
    this.changeFeltGuiltyLink = page
      .locator('#maincontent div')
      .filter({ hasText: 'In the past year, how often have you felt guilty' })
      .getByRole('link');
    this.changeMemoryLossLink = page
      .locator('#maincontent div')
      .filter({
        hasText: 'In the past year, how often have you been unable to remember'
      })
      .getByRole('link');
    this.changeAlcoholInjuredLink = page
      .locator('#maincontent div')
      .filter({ hasText: 'Have you or somebody else been injured' })
      .getByRole('link');
    this.changeRelativeConcernedLink = page
      .locator('#alcohol-relative-changeLink')
      .getByRole('link', { name: 'Change' });
    this.saveContinueButton = page.locator(
      'button:has-text("Save and continue")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator('h1:has-text("Check your answers")');
  }

  async clickChangeDoYouDrinkAlcoholLinkLink(): Promise<void> {
    await this.changeDoYouDrinkAlcoholLink.click();
  }

  async clickChangeHowOftenDoYouHaveDrinkLink(): Promise<void> {
    await this.changeHowOftenDoYouHaveDrinkLink.click();
  }

  async clickchangeOnTypicalDayWhenYouDrinkAlcoholLink(): Promise<void> {
    await this.changeOnTypicalDayWhenYouDrinkAlcoholLink.click();
  }

  async clickChangeOnHowOftenHaveYouHadSixOrMoreAlcoholUnitsLinkLink(): Promise<void> {
    await this.changeOnHowOftenHaveYouHadSixOrMoreAlcoholUnitsLink.click();
  }

  async clickChangeUnableToStopDrinkingLinkLink(): Promise<void> {
    await this.changeUnableToStopDrinkingLink.click();
  }

  async clickChangeFailedToDoWhatWasExpectedLinkLink(): Promise<void> {
    await this.changeFailedToDoWhatWasExpectedLink.click();
  }

  async clickChangeMorningAlcoholLinkLink(): Promise<void> {
    await this.changeMorningAlcoholLink.click();
  }

  async clickChangeFeltGuiltyLinkLink(): Promise<void> {
    await this.changeFeltGuiltyLink.click();
  }

  async clickChangeMemoryLossLinkLink(): Promise<void> {
    await this.changeMemoryLossLink.click();
  }

  async clickChangeAlcoholInjuredLinkLink(): Promise<void> {
    await this.changeAlcoholInjuredLink.click();
  }

  async clickChangeRelativeConcernedLinkLink(): Promise<void> {
    await this.changeRelativeConcernedLink.click();
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
    return pageTitlesMap[JourneyStepNames.CheckYourAnswersAlcoholPage];
  }
}
