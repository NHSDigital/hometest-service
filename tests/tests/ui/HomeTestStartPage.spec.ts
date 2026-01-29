import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import { config, EnvironmentVariables } from '../../configuration';


test.describe.configure({ mode: 'serial' });

test.describe('HIV Start Test Page', () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
  });


  test('Opening external links', async ({ homeTestStartPage }) => {
    await homeTestStartPage.waitForPageLoaded();

    const sexualHealthClinicUrl = config.get(EnvironmentVariables.EXTERNAL_LINK_SEXUAL_HEALTH_CLINIC);
    const nearestAEUrl = config.get(EnvironmentVariables.EXTERNAL_LINK_NEAREST_AE);
    const hivAidsInfoUrl = config.get(EnvironmentVariables.EXTERNAL_LINK_HIV_AIDS_INFO);

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
