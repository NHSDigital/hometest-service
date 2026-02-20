import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { AddressModel } from '../../models';

test.describe('Accessibility Testing @accessibility', () => {
  const randomAddress = AddressModel.getRandomAddress();

  test('How Comfortable Pricking Finger Page', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(howComfortablePrickingFingerPage.page, "How Comfortable Pricking Finger Page");
    expect(accessErrors).toHaveLength(0);
  });
});
