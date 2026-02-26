import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { Address } from '../../models/Address';

const deliveryAddress: Address = {
  postcode: 'TN37 7PT',
  addressLine1: '775 The Ridge',
  townCity: 'Saint Leonards-on-sea'
};

test(
  'Select delivery address page',
  {
    tag: ['@accessibility']
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    accessibility
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      selectDeliveryAddressPage.page,
      'Select Delivery Address Page'
    );
    expect(accessErrors).toHaveLength(0);
  }
);
