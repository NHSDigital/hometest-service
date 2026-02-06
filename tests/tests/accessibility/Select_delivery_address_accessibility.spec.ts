import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';

test.describe('Accessibility Testing @accessibility', () => {

  test('Select Delivery Address Page', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    const randomAddress = AddressModel.getRandomAddress();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    // Wait for page to load
    await selectDeliveryAddressPage.waitUntilPageLoad();


    const accessErrors = await accessibility.runAccessibilityCheck(selectDeliveryAddressPage.page, "Select Delivery Address Page");
    expect(accessErrors).toHaveLength(0);
  });
});
