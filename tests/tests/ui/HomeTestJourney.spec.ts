import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import { AddressModel } from '../../models';
import { config, EnvironmentVariables } from '../../configuration';
import { UserManagerFactory } from '../../utils/users/UserManagerFactory';

test.describe.configure({ mode: 'serial' });
const randomAddress = AddressModel.getRandomAddress();
let actualHeaderText = "";

test.describe('HIV Test Order journeys', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    actualHeaderText = await homeTestStartPage.getHeaderText();
    expect(actualHeaderText).toBe("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test('Order test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage }) => {
    await homeTestStartPage.clickStartNowButton();
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

  test('Order test journey by providing address manually', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage }) => {
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

  test('Order test journey by providing address manually from select delivery address page', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage, selectDeliveryAddressPage }) => {
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

  test('Choose to goto Sexual health clinic instead', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage, howComfortablePrickingFingerPage }) => {
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
  });

  test('Verify Privacy Policy page', async ({ homeTestStartPage, privacyPolicyPage, context }) => {
    const makeAComplaintUrl = config.get(EnvironmentVariables.EXTERNAL_LINK_MAKE_COMPLAINT);
    await homeTestStartPage.clickPrivacyPolicyLink();
    actualHeaderText = await privacyPolicyPage.getHeaderText();
    expect(actualHeaderText).toBe("Hometest Privacy Policy - Draft v1.0 Jan 2026");
    const [newTab] = await Promise.all([
      context.waitForEvent('page'), privacyPolicyPage.clickMakeAComplaintLink()
    ]);
    await newTab.waitForLoadState();
    expect(newTab.url()).toBe(makeAComplaintUrl);
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
