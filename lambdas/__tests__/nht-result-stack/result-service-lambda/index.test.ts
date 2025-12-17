import { handler } from '../../../src/nht-result-stack/result-service-lambda/index';

describe('Result Service Lambda', () => {
  it('should accept a result submission', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      path: '/results',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-12345',
        patientId: 'patient-001',
        supplierId: 'supplier-001',
        testType: 'blood-test',
        resultData: {
          status: 'negative',
          testDate: '2025-12-15',
          reportDate: '2025-12-15'
        }
      }),
      requestContext: {}
    } as any;

    const result = await handler(mockEvent, {} as any, () => {});
    
    expect(result).toBeDefined();
    expect(result.statusCode).toBe(202);
    
    const body = JSON.parse(result.body);
    expect(body.resultId).toBeDefined();
    expect(body.status).toBe('accepted');
  });
});
