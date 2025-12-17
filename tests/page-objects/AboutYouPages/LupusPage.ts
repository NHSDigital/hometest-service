import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { Lupus } from '@dnhc-health-checks/shared';

export class LupusPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Has a healthcare professional ever diagnosed you with lupus?',
      'Select if a healthcare professional has ever diagnosed you with lupus',
      JourneyStepNames.LupusPage
    );
  }

  async selectLupusOptionAndClickContinue(selection: Lupus): Promise<void> {
    switch (selection) {
      case Lupus.Yes:
        await this.clickYesRadioButton();
        break;
      case Lupus.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
