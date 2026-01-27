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

});
