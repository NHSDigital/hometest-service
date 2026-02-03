import { test, expect } from '../../fixtures';

test.describe('Order Tracking Page', () => {

  test('should display confirmed order status correctly', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('1');

    await expect(orderTrackingPage.orderHeading).toHaveText('HIV self-test');
    await expect(orderTrackingPage.statusTag).toHaveText('Confirmed');
    await expect(orderTrackingPage.statusHeading).toHaveText('Wait for your kit to be dispatched');
    await expect(orderTrackingPage.deliveryTimeframe).toContainText(/within 5 working days/);
  });

  test('should display Dispatched order status', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('2');

    await expect(orderTrackingPage.orderHeading).toHaveText('HIV self-test');
    await expect(orderTrackingPage.statusTag).toHaveText('Dispatched');
    await expect(orderTrackingPage.statusHeading).toHaveText('Wait for your kit to arrive');
    await expect(orderTrackingPage.deliveryTimeframe).toContainText(/within 5 working days/);
  });

  test('should display Test received order status', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('3');

    await expect(orderTrackingPage.orderHeading).toHaveText('HIV self-test');
    await expect(orderTrackingPage.statusTag).toHaveText('Test received');
    await expect(orderTrackingPage.statusHeading).toHaveText('Wait for your result');

  });

    test('should display Your result is ready order status', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('4');

    // Wait for page to load completely
    await orderTrackingPage.page.waitForLoadState('domcontentloaded');

    await expect(orderTrackingPage.orderHeading).toHaveText('HIV self-test');
    await expect(orderTrackingPage.statusHeading).toHaveText('Your result is ready');
    await expect(orderTrackingPage.resultsLink).toBeVisible({ timeout: 15000 });
  });

  test('should handle non-existent orders with error message', async ({ orderTrackingPage }) => {
    await orderTrackingPage.navigateToOrder('999');
    await expect(orderTrackingPage.errorAlert.locator('h1')).toHaveText('There is a problem');

  });
});
