import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';

test.describe('Accessibility Testing @accessibility', () => {

  test('Select Delivery Address Page', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, confirmAndUpdateMobileNumberPage, checkYourAnswersPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    const randomAddress = AddressModel.getRandomAddress();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    await confirmAndUpdateMobileNumberPage.clickContinue();
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await checkYourAnswersPage.selectConsentCheckbox();
    const accessErrors = await accessibility.runAccessibilityCheck(checkYourAnswersPage.page, "Check Your Answers Page");
    expect(accessErrors).toHaveLength(0);
  });
});
