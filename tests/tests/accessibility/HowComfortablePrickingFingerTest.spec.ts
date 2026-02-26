import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { type Address } from '../../models/Address';

const deliveryAddress: Address = {
  postcode: 'TN37 7PT',
  addressLine1: '775 The Ridge',
  townCity: 'Saint Leonards-on-sea',
};
test(
  'How comfortable pricking finger Page',
  {
    tag: ['@accessibility'],
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    accessibility,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    const accessErrors = await accessibility.runAccessibilityCheck(
      howComfortablePrickingFingerPage.page,
      'How Comfortable Pricking Finger Page',
    );
    expect(accessErrors).toHaveLength(0);
  },
);
