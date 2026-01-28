import { test } from '../../fixtures';
import { expect } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Test Page', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
  });


  test('home testing prototype page', async ({ homeTestStartPage }) => {
    const actualResult = await homeTestStartPage.getHeaderText();
    expect(actualResult).toBe("Get a self-test kit for HIV");
  });

});
