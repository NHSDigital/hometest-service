import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { ParentSiblingHeartAttack } from '@dnhc-health-checks/shared';

export class FamilyHeartAttackHistoryPage extends HTCPage {
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly doNotKnowButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly hadAHeartAttackErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.yesRadioButton = page.locator('#parent-sibling-heart-attack-1');
    this.noRadioButton = page.locator('#parent-sibling-heart-attack-2');
    this.doNotKnowButton = page.locator('#parent-sibling-heart-attack-3');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator(
      'h1:has-text("Have any of your parents or siblings had a heart attack or angina before the age of 60?")'
    );
    this.hadAHeartAttackErrorLink = page.getByRole('link', {
      name: 'Select if a parent or sibling had a heart attack or angina before 60'
    });
    this.errorMessage = page.getByText(
      'Error: Select if a parent or sibling had a heart attack or angina before 60'
    );
  }

  async clickNoRadioButton(): Promise<void> {
    await this.noRadioButton.click();
  }

  async clickYesRadioButton(): Promise<void> {
    await this.yesRadioButton.click();
  }

  async clickDoNotKnowButton(): Promise<void> {
    await this.doNotKnowButton.click();
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
    return pageTitlesMap[JourneyStepNames.ParentSiblingHeartAttackPage];
  }

  async selectFamilyHeartAttackOptions(
    selection: ParentSiblingHeartAttack
  ): Promise<void> {
    switch (selection) {
      case ParentSiblingHeartAttack.No:
        await this.noRadioButton.check();
        break;
      case ParentSiblingHeartAttack.Yes:
        await this.yesRadioButton.check();
        break;
      case ParentSiblingHeartAttack.Unknown:
        await this.doNotKnowButton.check();
        break;
    }
  }
  async selectHeartAttackOptionAndClickContinue(
    selection: ParentSiblingHeartAttack
  ): Promise<void> {
    await this.selectFamilyHeartAttackOptions(selection);
    await this.clickContinueButton();
  }
}
