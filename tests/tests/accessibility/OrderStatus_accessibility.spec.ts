import { expect, Page } from '@playwright/test';
import { test } from '../../fixtures';
import { type Result } from 'axe-core';

const accessErrors: Result[] = [];
test.describe('Accessibility Testing @accessibility', () => {

  test('Home Test - Confirmed Order Accessibility', async ({ orderStatusPage, accessibility }) => {
    await orderStatusPage.navigateToOrder('1');
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Confirmed", "Order Tracking Page"));
   
    await orderStatusPage.navigateToOrder('2');
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Dispatched", "Order Tracking Page"));
    
    await orderStatusPage.navigateToOrder('3');
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Test received", "Order Tracking Page"));
    
    await orderStatusPage.navigateToOrder('4');
    await orderStatusPage.waitUntilPageLoad();
    accessErrors.push(...await accessibility.runAccessibilityCheck(orderStatusPage, "Status Result Ready", "Order Tracking Page"));
    
    expect(accessErrors).toHaveLength(0);
  });
});
