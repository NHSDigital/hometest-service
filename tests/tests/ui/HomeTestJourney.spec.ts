import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import { AddressModel } from '../../models';
import { PersonalDetailsModel } from '../../models/PersonalDetails';

test.describe.configure({ mode: 'serial' });
const randomAddress = AddressModel.getRandomAddress();
const randomMobileNumber = PersonalDetailsModel.getRandomPersonalDetails();

test.describe('HIV Test Order journeys', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test('Order test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText("This is what you'll need to do to give a blood sample");
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
  });

  test('Mobile number test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, enterMobileNumberPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText("This is what you'll need to do to give a blood sample");
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.fillMobileNumberAndContinue(randomMobileNumber);
  });

  test('Confirm Mobile number test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, confirmAndUpdateMobileNumberPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText("This is what you'll need to do to give a blood sample");
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    await confirmAndUpdateMobileNumberPage.clickContinue();
  });

  test('Update Alternative Mobile number test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, confirmAndUpdateMobileNumberPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText("This is what you'll need to do to give a blood sample");
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(randomMobileNumber);
    await confirmAndUpdateMobileNumberPage.clickContinue();
  });

  test('Order test journey by providing address manually', async ({ findAddressPage, enterAddressManuallyPage }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

  test('Order test journey by providing address manually from select delivery address page', async ({ findAddressPage, enterAddressManuallyPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

  test('Choose to goto Sexual health clinic instead', async ({ findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
  });

  test('Check the guide to giving blood samples', async ({ findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage, bloodSampleGuidePage}) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.clickBloodSampleGuideLink();
    await expect(bloodSampleGuidePage.headerText).toHaveText("Blood sample step-by-step guide");
  });
});
