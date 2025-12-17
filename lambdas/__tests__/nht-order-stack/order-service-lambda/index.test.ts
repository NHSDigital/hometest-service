import { handler } from '../../../src/nht-order-stack/order-service-lambda/index';

describe('Order Service Lambda', () => {
  it('should place an order successfully', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      path: '/orders',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: 'test-001',
        patientId: 'patient-001',
        deliveryAddress: {
          line1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA'
        },
        phoneNumber: '+447123456789'
      }),
      requestContext: {}
    } as any;

    const result = await handler(mockEvent, {} as any, () => {});
    
    expect(result).toBeDefined();
    expect(result.statusCode).toBe(201);
    
    const body = JSON.parse(result.body);
    expect(body.orderId).toBeDefined();
    expect(body.status).toBe('queued');
  });

  it('should return 400 when body is missing', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      path: '/orders',
      headers: {},
      body: null,
      requestContext: {}
    } as any;

    const result = await handler(mockEvent, {} as any, () => {});
    
    expect(result.statusCode).toBe(400);
  });
});
