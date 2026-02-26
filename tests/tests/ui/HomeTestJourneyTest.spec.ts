import { test } from '../../fixtures/CombinedTestFixture';
import { expect } from '@playwright/test';
import { type Address } from '../../models/Address';
import { type PersonalDetails } from '../../models/PersonalDetails';

const deliveryAddress: Address = {
  postcode: 'TN37 7PT',
  addressLine1: '775 The Ridge',
  townCity: 'Saint Leonards-on-sea'
};

const personalDetails: PersonalDetails = {
  mobileNumber: '447771900900'
};

test.describe('HIV Test Order journeys', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText(
      'Get a self-test kit for HIV'
    );
    await homeTestStartPage.clickStartNowButton();
  });

  test('Order test journey', async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(deliveryAddress.postcode);
    expect(firstLineAddress).toBe(deliveryAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText(
      "This is what you'll need to do to give a blood sample"
    );
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
  });

  test('Mobile number test journey', async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    enterMobileNumberPage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(deliveryAddress.postcode);
    expect(firstLineAddress).toBe(deliveryAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText(
      "This is what you'll need to do to give a blood sample"
    );
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.fillAlternativeMobileNumberAndContinue(
      personalDetails
    );
  });

  test('Order test journey by providing address manually', async ({
    findAddressPage,
    enterAddressManuallyPage
  }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(deliveryAddress);
  });

  test('Order test journey by providing address manually from select delivery address page', async ({
    findAddressPage,
    enterAddressManuallyPage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(deliveryAddress);
  });

  test('Choose to goto Sexual health clinic instead', async ({
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
  });

  test('Check the guide to giving blood samples', async ({
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    bloodSampleGuidePage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(deliveryAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(deliveryAddress.postcode);
    expect(firstLineAddress).toBe(deliveryAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.clickBloodSampleGuideLink();
    await expect(bloodSampleGuidePage.headerText).toHaveText(
      'Blood sample step-by-step guide'
    );
  });
});
