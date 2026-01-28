import { test } from '../../fixtures';
import { expect } from '@playwright/test';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Start Test Page', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
  });


  test('Opening external links', async ({ homeTestStartPage }) => {
    await homeTestStartPage.waitForPageLoaded();
  });

});
