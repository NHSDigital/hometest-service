import { test } from '../../fixtures';
import { expect } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  test.beforeEach(async ({ homeTestPage }) => {
    await homeTestPage.navigate();
  });


  test('home testing prototype page', async ({ homeTestPage }) => {
    const actualResult = await homeTestPage.getText();
    expect(actualResult[0]).toBe("Get a self-test kit for HIV");
  });

});
