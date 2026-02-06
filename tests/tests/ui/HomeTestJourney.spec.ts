import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import data from '../../test-data/address.json';

test.describe.configure({ mode: 'serial' });
const randomEntry = data[Math.floor(Math.random() * data.length)];

test.describe('HIV Test Order journeys', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    const actualResult = await homeTestStartPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test('Order test journey', async ({ homeTestStartPage, findAddressPage, selectDeliveryAddressPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomEntry);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postcode, firstLineAddress } = await findAddressPage.getPostcodeAndAddressValues();
    expect(postcode).toBe(randomEntry.postcode);
    expect(firstLineAddress).toBe(randomEntry.addressline1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
  });

  test('Order test journey by providing address manually', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomEntry)
  });

  test('Order test journey by providing address manually from select delivery address page', async ({ homeTestStartPage, findAddressPage, enterAddressManuallyPage, selectDeliveryAddressPage }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomEntry);
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomEntry)
  });

});
