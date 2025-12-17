import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { AntipsychoticMedication } from '@dnhc-health-checks/shared';

export class AntipsychoticMedicationPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Medicines for severe mental health conditions',
      'Select if you are currently taking any of the medicines listed',
      JourneyStepNames.AtypicalAntipsychoticMedication
    );
  }

  async selectAntipsychoticMedicationOptionAndClickContinue(
    selection: AntipsychoticMedication
  ): Promise<void> {
    switch (selection) {
      case AntipsychoticMedication.Yes:
        await this.clickYesRadioButton();
        break;
      case AntipsychoticMedication.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
