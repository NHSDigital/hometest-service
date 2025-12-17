import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { Migraines } from '@dnhc-health-checks/shared';

export class MigrainesPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Has a healthcare professional ever diagnosed you with migraines?',
      'Select if a healthcare professional has ever diagnosed you with migraines',
      JourneyStepNames.Migraines
    );
  }

  async selectMigrainesOptionAndClickContinue(
    selection: Migraines
  ): Promise<void> {
    switch (selection) {
      case Migraines.Yes:
        await this.clickYesRadioButton();
        break;
      case Migraines.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
