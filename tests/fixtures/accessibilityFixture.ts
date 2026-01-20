import { test as base } from '@playwright/test';
import { AccessibilityModule, accessibilityModule } from '../utils';

type AccessibilityFixtures = {
  accessibility: AccessibilityModule;
};

export const accessibilityFixture = base.extend<AccessibilityFixtures>({
  accessibility: async ({}, use) => {
    await use(accessibilityModule);
  },
});
