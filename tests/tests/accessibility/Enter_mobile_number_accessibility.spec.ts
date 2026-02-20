import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';

test.describe('Accessibility Testing @accessibility', () => {

  test('Enter mobile number scenario', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility, enterMobileNumberPage, howComfortablePrickingFingerPage }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    const randomAddress = AddressModel.getRandomAddress();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();      
    await enterMobileNumberPage.fillMobileNumberAndContinue(randomAddress);
    const accessErrors = await accessibility.runAccessibilityCheck(enterMobileNumberPage.page, "Enter Mobile Number Page");
    expect(accessErrors).toHaveLength(0);
  });
});