import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { ParentSiblingChildDiabetes } from '@dnhc-health-checks/shared';

export class FamilyDiabetesHistoryPage extends HTCPage {
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly doNotKnowButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly haveADiabetesErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.yesRadioButton = page.locator('#parent-sibling-child-diabetes-1');
    this.noRadioButton = page.locator('#parent-sibling-child-diabetes-2');
    this.doNotKnowButton = page.locator('#parent-sibling-child-diabetes-3');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator(
      'h1:has-text("Do you have a parent, sibling or child with diabetes?")'
    );
    this.haveADiabetesErrorLink = page.getByRole('link', {
      name: 'Select if you have a parent, sibling or child with diabetes'
    });
    this.errorMessage = page.getByText(
      'Error: Select if you have a parent, sibling or child with diabetes'
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
    return pageTitlesMap[JourneyStepNames.ParentSiblingChildDiabetesPage];
  }

  async selectDiabetesOptions(
    selection: ParentSiblingChildDiabetes
  ): Promise<void> {
    switch (selection) {
      case ParentSiblingChildDiabetes.No:
        await this.noRadioButton.check();
        break;
      case ParentSiblingChildDiabetes.Yes:
        await this.yesRadioButton.check();
        break;
      case ParentSiblingChildDiabetes.Unknown:
        await this.doNotKnowButton.check();
        break;
    }
  }
  async selectDiabetesOptionsAndClickContinue(
    selection: ParentSiblingChildDiabetes
  ): Promise<void> {
    await this.selectDiabetesOptions(selection);
    await this.clickContinueButton();
  }
}
