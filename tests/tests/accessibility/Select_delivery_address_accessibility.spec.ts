import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import data from '../../test-data/address.json';

test.describe('Accessibility Testing @accessibility', () => {

  test('Select Delivery Address Page', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    const randomEntry = data[Math.floor(Math.random() * data.length)];
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomEntry.postcode, randomEntry.addressline1);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    const hasViolations = await accessibility.runAccessibilityCheck(selectDeliveryAddressPage.page, "Select Delivery Address Page");
    expect(hasViolations).toBe(false);
  });
});
