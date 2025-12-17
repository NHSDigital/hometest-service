import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { SevereMentalIllness } from '@dnhc-health-checks/shared';

export class SevereMentalIllnessPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Has a healthcare professional ever diagnosed you with a severe mental health condition?',
      'Select if a healthcare professional has ever diagnosed you with a severe mental health condition',
      JourneyStepNames.SevereMentalIllness
    );
  }

  async selectSevereMentalIllnessOptionAndClickContinue(
    selection: SevereMentalIllness
  ): Promise<void> {
    switch (selection) {
      case SevereMentalIllness.Yes:
        await this.clickYesRadioButton();
        break;
      case SevereMentalIllness.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
