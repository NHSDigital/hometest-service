import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import data from '../../test-data/address.json';

test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
  });


  test('Order test journey', async ({ homeTestStartPage, findAddressPage }) => {
    const actualResult = await homeTestStartPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
    const randomEntry = data[Math.floor(Math.random() * data.length)];
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomEntry.postcode, randomEntry.address);
  });
});
