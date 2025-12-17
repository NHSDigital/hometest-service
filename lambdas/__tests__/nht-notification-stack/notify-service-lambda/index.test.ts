import { handler } from '../../../src/nht-notification-stack/notify-service-lambda/index';

describe('Notify Service Lambda', () => {
  it('should queue a notification', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      path: '/notifications',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'patient-001',
        type: 'sms',
        templateId: 'template-001',
        templateData: { name: 'Test User' },
        recipient: {
          phoneNumber: '+447123456789'
        }
      }),
      requestContext: {}
    } as any;

    const result = await handler(mockEvent, {} as any, () => {});
    
    expect(result).toBeDefined();
    expect(result.statusCode).toBe(202);
    
    const body = JSON.parse(result.body);
    expect(body.notificationId).toBeDefined();
    expect(body.status).toBe('queued');
  });
});
