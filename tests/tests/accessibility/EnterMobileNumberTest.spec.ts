import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { Address } from '../../models/Address';
import { PersonalDetails } from '../../models/PersonalDetails';

const deliveryAddress: Address = {
  postcode: 'TN37 7PT',
  addressLine1: '775 The Ridge',
  townCity: 'Saint Leonards-on-sea'
};

const personalDetails: PersonalDetails = {
  mobileNumber: '00447921713191'
};

test(
  'Enter mobile number page',
  {
    tag: ['@accessibility']
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    enterMobileNumberPage,
    howComfortablePrickingFingerPage
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.fillMobileNumberAndContinue(personalDetails);
    const accessErrors = await accessibility.runAccessibilityCheck(
      enterMobileNumberPage.page,
      'Enter Mobile Number Page'
    );
    expect(accessErrors).toHaveLength(0);
  }
);
