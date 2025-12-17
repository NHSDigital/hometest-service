import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { SteroidTablets } from '@dnhc-health-checks/shared';

export class SteroidPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Corticosteroid tablets',
      'Select if you regularly take steroid tablets',
      JourneyStepNames.SteroidTablets
    );
  }

  async selectSteroidOptionAndClickContinue(
    selection: SteroidTablets
  ): Promise<void> {
    switch (selection) {
      case SteroidTablets.Yes:
        await this.clickYesRadioButton();
        break;
      case SteroidTablets.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
