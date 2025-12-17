import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { Impotence } from '@dnhc-health-checks/shared';

export class ErectileDysfunctionPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?',
      'Select if a healthcare professional has ever diagnosed you with erectile dysfunction, or you have ever taken medicine for it',
      JourneyStepNames.ErectileDysfunction
    );
  }

  async selectErectileDysfunctionOptionAndClickContinue(
    selection: Impotence
  ): Promise<void> {
    switch (selection) {
      case Impotence.Yes:
        await this.clickYesRadioButton();
        break;
      case Impotence.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
