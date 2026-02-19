import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';

test.describe('Accessibility Testing @accessibility', () => {

  test('Select Delivery Address Page', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility, enterMobileNumberPage }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    const randomAddress = AddressModel.getRandomAddress();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await enterMobileNumberPage.fillMobileNumberAndContinue(randomAddress);
    const accessErrors = await accessibility.runAccessibilityCheck(enterMobileNumberPage.page, "Enter Mobile Number Page");
    expect(accessErrors).toHaveLength(0);
  });
});