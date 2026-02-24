import { test } from '../../fixtures';
import { expect } from '@playwright/test';

import { EXTERNAL_LINKS } from '../../../shared/enum/external-links';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Start Test Page', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
  });

  test('Opening external links', async ({ homeTestStartPage }) => {
    await homeTestStartPage.waitUntilPageLoad();

    const sexualHealthClinicUrl = EXTERNAL_LINKS.SEXUAL_HEALTH_CLINIC;
    const nearestAEUrl = EXTERNAL_LINKS.NEAREST_AE;
    const hivAidsInfoUrl = EXTERNAL_LINKS.HIV_AIDS_INFO;

    // Test "Find a sexual health clinic" link
    await homeTestStartPage.clickFindClinicLink(sexualHealthClinicUrl);
    expect(homeTestStartPage.page.url()).toBe(sexualHealthClinicUrl);
    await homeTestStartPage.page.goBack();

    // Test "your nearest A&E" link
    await homeTestStartPage.clickNearestAELink(nearestAEUrl);
    expect(homeTestStartPage.page.url()).toBe(nearestAEUrl);
    await homeTestStartPage.page.goBack();

    // Test "your nearest sexual health clinic" link
    await homeTestStartPage.clickNearestSexualHealthClinicLink(sexualHealthClinicUrl);
    expect(homeTestStartPage.page.url()).toBe(sexualHealthClinicUrl);
    await homeTestStartPage.page.goBack();

    // Test "Learn more about HIV and AIDS" link
    await homeTestStartPage.clickLearnMoreHIVAidsLink(hivAidsInfoUrl);
    expect(homeTestStartPage.page.url()).toBe(hivAidsInfoUrl);
    await homeTestStartPage.page.goBack();
  });
});
