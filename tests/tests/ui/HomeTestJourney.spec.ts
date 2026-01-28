import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import data from '../../test-data/address.json';

test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  test.beforeEach(async ({ homeTestPage }) => {
    await homeTestPage.navigate();
  });


  test('home testing prototype page', async ({ homeTestPage }) => {
    const actualResult = await homeTestPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
  });

  test('should display address results for a valid postcode and building number or name', async ({ homeTestPage, findAddressPage }) => {
    // Submit a valid postcode and verify address results
    await homeTestPage.clickStartNowButton();
    const randomEntry = data[Math.floor(Math.random() * data.length)];
    await findAddressPage.fillPostCodeAndAddress(randomEntry.postcode, randomEntry.address);
  });

});
