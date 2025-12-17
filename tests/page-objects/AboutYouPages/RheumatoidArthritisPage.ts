import { type Page } from '@playwright/test';
import { RadioConfirmationPage } from '../RadioConfirmationPage';
import { JourneyStepNames } from '../../route-paths';
import { RheumatoidArthritis } from '@dnhc-health-checks/shared';

export class RheumatoidArthritisPage extends RadioConfirmationPage {
  constructor(page: Page) {
    super(
      page,
      'Has a healthcare professional ever diagnosed you with rheumatoid arthritis?',
      'Select if a healthcare professional has ever diagnosed you with rheumatoid arthritis',
      JourneyStepNames.RheumatoidArthritis
    );
  }

  async selectRheumatoidArthritisOptionAndClickContinue(
    selection: RheumatoidArthritis
  ): Promise<void> {
    switch (selection) {
      case RheumatoidArthritis.Yes:
        await this.clickYesRadioButton();
        break;
      case RheumatoidArthritis.No:
        await this.clickNoRadioButton();
        break;
    }
    await this.clickContinueButton();
  }
}
