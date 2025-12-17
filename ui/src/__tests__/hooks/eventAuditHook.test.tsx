import {
  type IEventAuditRequest,
  useAuditEvent
} from '../../hooks/eventAuditHook';
import { httpClient } from '../../lib/http/http-client';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { rum } from '../../lib/rum/rum-client';

jest.mock('../../lib/http/http-client', () => ({
  httpClient: {
    postRequest: jest.fn()
  }
}));

describe('useAuditEvent hook tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;

  const event: IEventAuditRequest = {
    healthCheck,
    patientId: 'abcd1234',
    eventType: AuditEventType.SectionCompleteAboutYou
  };
  const postRequestSpy = jest.spyOn(httpClient, 'postRequest');
  const recordAuditEventErrorSpy = jest
    .spyOn(rum, 'recordAuditEventError')
    .mockImplementation(async () => {});
  const { triggerAuditEvent } = useAuditEvent();

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('triggerAuditEvent method', () => {
    it('should send a post request to events endpoint', async () => {
      postRequestSpy.mockResolvedValue('Event sent');

      await triggerAuditEvent(event);

      expect(recordAuditEventErrorSpy).not.toHaveBeenCalled();
      expect(postRequestSpy).toHaveBeenCalledTimes(1);
      expect(postRequestSpy).toHaveBeenCalledWith('test.com/events', {
        healthCheckId: event.healthCheck?.id,
        hcDataModelVersion: event.healthCheck?.dataModelVersion,
        eventType: event.eventType
      });
    });

    it.each([500, 502, 511])(
      'should retry on failed request with 5xx response: %d',
      async (status: number) => {
        postRequestSpy.mockRejectedValue({ response: { status } });

        await triggerAuditEvent(event);

        expect(recordAuditEventErrorSpy).toHaveBeenCalledTimes(1);
        expect(recordAuditEventErrorSpy).toHaveBeenCalledWith({
          errorMessage:
            'Unable to make a successful audit event call after 3 attempts',
          auditEventType: event.eventType,
          healthCheckId: event.healthCheck?.id,
          hcDataModelVersion: event.healthCheck?.dataModelVersion,
          patientId: event.patientId
        });
        expect(postRequestSpy).toHaveBeenCalledTimes(3);
      }
    );

    it.each([300, 308, 400, 499])(
      'should not retry on failed request with response other than 5xx: %d',
      async (status: number) => {
        const expectedError = { response: { status } };
        postRequestSpy.mockRejectedValue(expectedError);

        await triggerAuditEvent(event);

        expect(recordAuditEventErrorSpy).toHaveBeenCalledTimes(1);
        expect(recordAuditEventErrorSpy).toHaveBeenCalledWith({
          errorMessage: 'Unable to make a successful audit event call',
          auditEventType: event.eventType,
          errorDetails: expectedError,
          healthCheckId: event.healthCheck?.id,
          hcDataModelVersion: event.healthCheck?.dataModelVersion,
          patientId: event.patientId
        });
        expect(postRequestSpy).toHaveBeenCalledTimes(1);
      }
    );

    it('should not retry on failed request without a response object', async () => {
      const expectedError = {};

      postRequestSpy.mockRejectedValue(expectedError);

      await triggerAuditEvent(event);

      expect(recordAuditEventErrorSpy).toHaveBeenCalledTimes(1);
      expect(recordAuditEventErrorSpy).toHaveBeenCalledWith({
        errorMessage: 'Unable to make a successful audit event call',
        auditEventType: event.eventType,
        healthCheckId: event.healthCheck?.id,
        hcDataModelVersion: event.healthCheck?.dataModelVersion,
        patientId: event.patientId,
        errorDetails: expectedError
      });
      expect(postRequestSpy).toHaveBeenCalledTimes(1);
    });
  });
});
