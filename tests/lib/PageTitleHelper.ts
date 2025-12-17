import { expect } from '@playwright/test';
import { type HTCPage } from '../page-objects/HTCPage';

export async function verifyPageTitle(page: HTCPage): Promise<void> {
  await expect(page.getPage()).toHaveTitle(page.getExpectedTitle());
}

export async function verifyErrorPageTitle(page: HTCPage): Promise<void> {
  await expect(page.getPage()).toHaveTitle(page.getExpectedErrorTitle());
}
