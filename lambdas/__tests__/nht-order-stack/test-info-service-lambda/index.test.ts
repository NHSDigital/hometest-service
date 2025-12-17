import { handler } from '../../../src/nht-order-stack/test-info-service-lambda/index';

describe('Test Info Service Lambda', () => {
  it('should return test info successfully', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/tests',
      headers: {},
      requestContext: {}
    } as any;

    const result = await handler(mockEvent, {} as any, () => {});
    
    expect(result).toBeDefined();
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.tests).toBeDefined();
    expect(Array.isArray(body.tests)).toBe(true);
  });
});
