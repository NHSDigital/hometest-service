import { rum } from '../../../lib/rum/rum-client';
import { RumEventType } from '../../../lib/models/rum-event-type';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { fromCognitoIdentity } from '@aws-sdk/credential-providers';
import { httpClient } from '../../../lib/http/http-client';

const mockEnable = jest.fn();
const mockSetAwsCredentials = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock('aws-rum-web', () => ({
  AwsRum: jest.fn().mockImplementation(() => ({
    enable: mockEnable,
    setAwsCredentials: mockSetAwsCredentials,
    recordEvent: mockRecordEvent
  }))
}));

jest.mock('@aws-sdk/credential-providers', () => ({
  fromCognitoIdentity: jest.fn().mockReturnValue('mocked-credentials')
}));

describe('RumClient', () => {
  const getRequestSpy = jest.spyOn(httpClient, 'getRequest');

  beforeEach(() => {
    getRequestSpy.mockResolvedValue({
      token: 'new token',
      identityId: 'new identity id'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    getRequestSpy.mockReset();

    // Reset RumClient state between tests
    (rum as any).enabled = false;
    (rum as any).awsRum = null;
    (rum as any).token = null;
  });

  describe('enable', () => {
    it('should enable rum and set credentials', () => {
      rum.enable('token123', 'identity456');

      expect(fromCognitoIdentity).toHaveBeenCalledWith({
        identityId: 'identity456',
        logins: {
          'cognito-identity.amazonaws.com': 'token123'
        },
        clientConfig: { region: 'eu-west-2' }
      });

      expect(mockSetAwsCredentials).toHaveBeenCalledWith('mocked-credentials');
      expect(mockEnable).toHaveBeenCalled();
    });
  });

  describe('recordEvent', () => {
    it('should record event if enabled', async () => {
      rum.enable('token123', 'identity456');

      await rum.recordEvent({
        eventType: RumEventType.EVENT_AUDIT_ERROR,
        additionalData: { day: 'monday' },
        healthCheckId: '12345',
        patientId: 'patient-1'
      });

      expect(mockRecordEvent).toHaveBeenCalledWith(
        RumEventType.EVENT_AUDIT_ERROR,
        expect.objectContaining({
          day: 'monday',
          healthCheckId: '12345',
          patientId: 'patient-1'
        })
      );
      expect(getRequestSpy).not.toHaveBeenCalled();
    });

    it('should try to refresh token if not set', async () => {
      // didn't enabled RUM

      await rum.recordEvent({
        eventType: RumEventType.EVENT_AUDIT_ERROR,
        additionalData: { day: 'monday' },
        healthCheckId: '12345',
        patientId: 'patient-1'
      });

      expect(mockRecordEvent).toHaveBeenCalledWith(
        RumEventType.EVENT_AUDIT_ERROR,
        expect.objectContaining({
          day: 'monday',
          healthCheckId: '12345',
          patientId: 'patient-1'
        })
      );
      verifyRumTokenRefreshed();
    });

    it('should not record event if not enabled', async () => {
      // didn't enabled RUM and refresh failed
      getRequestSpy.mockRejectedValue({});

      await rum.recordEvent({
        eventType: RumEventType.EVENT_AUDIT_ERROR
      });

      expect(mockRecordEvent).not.toHaveBeenCalled();
    });
  });

  describe('recordAuditEventError', () => {
    it('should record audit error event', async () => {
      rum.enable('token123', 'identity456');

      await rum.recordAuditEventError({
        auditEventType: AuditEventType.AddressLookupPerformed,
        errorMessage: 'error message',
        errorDetails: { code: 500 },
        healthCheckId: '12345',
        patientId: 'patient-1'
      });

      expect(mockRecordEvent).toHaveBeenCalledWith(
        RumEventType.EVENT_AUDIT_ERROR,
        expect.objectContaining({
          auditEventType: AuditEventType.AddressLookupPerformed,
          errorMessage: 'error message',
          errorDetails: JSON.stringify({ code: 500 }),
          healthCheckId: '12345',
          patientId: 'patient-1'
        })
      );
    });
  });

  describe('recordErrorEvent', () => {
    it('should record error event', async () => {
      rum.enable('token123', 'identity456');

      await rum.recordErrorEvent({
        eventType: RumEventType.UNEXPECTED_ERROR,
        errorMessage: 'some failure',
        errorDetails: { details: 'unexpected' },
        healthCheckId: '12345',
        patientId: 'patient-1'
      });

      expect(mockRecordEvent).toHaveBeenCalledWith(
        RumEventType.UNEXPECTED_ERROR,
        expect.objectContaining({
          errorMessage: 'some failure',
          errorDetails: JSON.stringify({ details: 'unexpected' }),
          healthCheckId: '12345',
          patientId: 'patient-1'
        })
      );
    });
  });

  describe('isEnabled', () => {
    it('should return true after enable is called', () => {
      expect(rum.isEnabled()).toBe(false);
      rum.enable('token', 'id');
      expect(rum.isEnabled()).toBe(true);
    });
  });

  function verifyRumTokenRefreshed() {
    expect(getRequestSpy).toHaveBeenCalledWith(
      `${process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT}/rum-identity`
    );
    expect(fromCognitoIdentity).toHaveBeenCalledWith({
      identityId: 'new identity id',
      logins: {
        'cognito-identity.amazonaws.com': 'new token'
      },
      clientConfig: { region: 'eu-west-2' }
    });

    expect(mockSetAwsCredentials).toHaveBeenCalledWith('mocked-credentials');
    expect(mockEnable).toHaveBeenCalled();
  }
});
