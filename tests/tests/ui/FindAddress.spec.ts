import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import data from '../../test-data/address.json';

test.describe.configure({ mode: 'serial' });

test.describe('Find Address by Postcode', () => {
  test.beforeEach(async ({ homeTestPage }) => {
    await homeTestPage.navigate();
  });

  test('click Start Now button to navigate to find delivery address page', async ({ homeTestPage, findAddressPage }) => {
    // Verify navigation to Find Address page
    await homeTestPage.clickStartNowButton();
    await findAddressPage.navigateAndVerifyPage();
  });

  test('should display address results for a valid postcode', async ({ homeTestPage, findAddressPage }) => {
    // Submit a valid postcode and verify address results
    await homeTestPage.clickStartNowButton();
    for (const entry of data) {
      await findAddressPage.validatePostcode(entry.postcode, entry.address);
    }
  });

  test('verify invalid postcode and building name or number', async ({ homeTestPage, findAddressPage }) => {
    // Submit a invalid postcode and building name or number and verify error messages
    await homeTestPage.clickStartNowButton();
    await findAddressPage.verifyErrorPostcodeBuildingNumber("", "", "Enter a full UK postcode", "");
    await findAddressPage.verifyErrorPostcodeBuildingNumber("RG129SRSR", "1 hurricane gate%", "Postcode must be 8 characters or less", "Enter the building number or name");
    await findAddressPage.verifyErrorPostcodeBuildingNumber("RG12&9SR", "Creating a long string with one hundred characters requires careful planning and balanced wording 101", "Enter a postcode using letters and numbers", "Building number or name must be 100 characters or less");
    await findAddressPage.verifyErrorPostcodeBuildingNumber("RG 129SR", "", "Enter a postcode using letters and numbers", "");
    await findAddressPage.verifyErrorPostcodeBuildingNumber("RG1 29SR", "", "Enter a postcode using letters and numbers", "");
  });

});
