import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';
import { PersonalDetailsModel } from '../../models/PersonalDetails';

test.describe('Accessibility Testing @accessibility', () => {

    test('Confirm and update mobile number scenario - Update', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility, confirmAndUpdateMobileNumberPage, howComfortablePrickingFingerPage }) => {
        await homeTestStartPage.navigate();
        await homeTestStartPage.clickStartNowButton();
        const randomAddress = AddressModel.getRandomAddress();
        await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
        await selectDeliveryAddressPage.waitUntilPageLoad();
        await selectDeliveryAddressPage.selectAddressAndContinue();
        await howComfortablePrickingFingerPage.waitUntilPageLoad();
        await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
        const randomMobileNumber = PersonalDetailsModel.getRandomPersonalDetails();
        await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumberAndContinue(randomMobileNumber);
        const accessErrors = await accessibility.runAccessibilityCheck(confirmAndUpdateMobileNumberPage.page, "Confirm and Update Mobile Number Page");
        expect(accessErrors).toHaveLength(0);
    });

        test('Confirm and update mobile number scenario - Confirm', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility, confirmAndUpdateMobileNumberPage, howComfortablePrickingFingerPage }) => {
        await homeTestStartPage.navigate();
        await homeTestStartPage.clickStartNowButton();
        const randomAddress = AddressModel.getRandomAddress();
        await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
        await selectDeliveryAddressPage.waitUntilPageLoad();
        await selectDeliveryAddressPage.selectAddressAndContinue();
        await howComfortablePrickingFingerPage.waitUntilPageLoad();
        await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
        const randomMobileNumber = PersonalDetailsModel.getRandomPersonalDetails();
        await confirmAndUpdateMobileNumberPage.confirmMobileNumberAndContinue();
        const accessErrors = await accessibility.runAccessibilityCheck(confirmAndUpdateMobileNumberPage.page, "Confirm and Update Mobile Number Page");
        expect(accessErrors).toHaveLength(0);
    });
});
