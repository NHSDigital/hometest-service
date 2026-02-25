import { Locator, Page } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import { BasePage } from './BasePage';
import { PersonalDetailsModel } from '../models/PersonalDetails';

export class ConfirmAndUpdateMobileNumberPage extends BasePage {
    readonly mobileNumberInput: Locator;
    readonly useAnotherMobileNumber: Locator;
    readonly confirmMobileNumber: Locator;
    readonly continueButton: Locator;

    constructor(page: Page) {
        super(page);
        this.confirmMobileNumber = page.locator('#phone-confirmation-1--label');
        this.useAnotherMobileNumber = page.locator('#phone-confirmation-2--label');
        this.mobileNumberInput = page.locator('#alternative-mobile-number');
        this.continueButton = page.getByRole('button', { name: 'Continue' });
    }

    async fillAlternativeMobileNumber(randomEntry: PersonalDetailsModel): Promise<void> {
        await this.useAnotherMobileNumber.check();
        await this.mobileNumberInput.fill(randomEntry.mobileNumber);      
    }

    async selectConfirmMobileNumber(): Promise<void> {
        await this.confirmMobileNumber.check();        
    }

     async clickContinue(): Promise<void> {
        await this.continueButton.click();
    }
}
