import { test, expect } from '../../fixtures';

test.describe('Order Tracking Page', () => {

  test('should display confirmed order status correctly', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('1');

    await expect(orderTrackingPage.orderHeading).toHaveText('HIV self-test');
    await expect(orderTrackingPage.statusTag).toHaveText('Confirmed');
    await expect(orderTrackingPage.statusHeading).toHaveText('Wait for your kit to be dispatched');
    await expect(orderTrackingPage.deliveryTimeframe).toContainText(/within 5 working days/);
  });

  test('should handle non-existent orders with error message', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('999');
    await expect(orderTrackingPage.errorAlert.locator('h1')).toHaveText('There is a problem');

  });
});
