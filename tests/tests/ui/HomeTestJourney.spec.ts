import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import { AddressModel } from '../../models';

test.describe.configure({ mode: 'serial' });
const randomAddress = AddressModel.getRandomAddress();

test.describe('HIV Test Order journeys', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    const actualResult = await homeTestStartPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test('Order test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomAddress.postcode);
    expect(firstLineAddress).toBe(randomAddress.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
  });

  test('Order test journey by providing address manually', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

  test('Order test journey by providing address manually from select delivery address page', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage, selectDeliveryAddressPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress)
  });

});
