import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import data from '../../test-data/address.json';

test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  test.beforeEach(async ({ homeTestPage }) => {
    await homeTestPage.navigate();
  });


  test('Order test journey', async ({ homeTestPage, findAddressPage }) => {
    const actualResult = await homeTestPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
    await homeTestPage.clickStartNowButton();
    const randomEntry = data[Math.floor(Math.random() * data.length)];
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomEntry.postcode, randomEntry.address);
  });
});
