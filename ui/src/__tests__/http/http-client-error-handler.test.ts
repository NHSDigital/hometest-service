import { DefaultHttpClientErrorHandler } from '../../lib/http/http-client-error-handler';
import { RoutePath } from '../../lib/models/route-paths';
import {
  type IHealthCheck,
  HealthCheckUpdateErrorReason
} from '@dnhc-health-checks/shared';
import { rum } from '../../lib/rum/rum-client';
import { RumEventType } from '../../lib/models/rum-event-type';

describe('HTTP error handler tests', () => {
  let navigateMock: jest.Mock;

  const healthCheck = {
    id: 'test-health-check',
    patientId: 'test-patient-id'
  } as IHealthCheck;
  let recordErrorEventSpy: jest.SpyInstance;

  beforeEach(() => {
    navigateMock = jest.fn();
    recordErrorEventSpy = jest
      .spyOn(rum, 'recordErrorEvent')
      .mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should navigate to generic error page when any other error appears', async () => {
    const errorHandler = new DefaultHttpClientErrorHandler(navigateMock);
    await errorHandler.handle(new Error());

    expect(navigateMock).toHaveBeenCalledWith(RoutePath.UnexpectedErrorPage);
  });

  test('should send RUM event when any other error appears', async () => {
    const errorHandler = new DefaultHttpClientErrorHandler(navigateMock);
    await errorHandler.handle(new Error(), healthCheck);

    expect(recordErrorEventSpy).toHaveBeenCalledTimes(1);
    expect(recordErrorEventSpy).toHaveBeenCalledWith({
      eventType: RumEventType.UNEXPECTED_ERROR,
      errorMessage: 'Unknown error',
      healthCheckId: healthCheck.id,
      patientId: healthCheck.patientId,
      errorDetails: { failureReason: undefined }
    });
  });

  test('should send RUM event with error message when any other error appears', async () => {
    const errorMessage = 'Test error message';
    const errorHandler = new DefaultHttpClientErrorHandler(navigateMock);
    await errorHandler.handle(new Error(errorMessage), healthCheck);

    expect(recordErrorEventSpy).toHaveBeenCalledTimes(1);
    expect(recordErrorEventSpy).toHaveBeenCalledWith({
      eventType: RumEventType.UNEXPECTED_ERROR,
      errorMessage: errorMessage,
      healthCheckId: healthCheck.id,
      patientId: healthCheck.patientId,
      errorDetails: { failureReason: undefined }
    });
  });

  test('should navigate to health check expired page and send RUM event with failureReason when health check expired error appears', async () => {
    const errorMessage = 'Health check has expired';
    const error = {
      message: errorMessage,
      response: {
        data: { failureReason: HealthCheckUpdateErrorReason.HealthCheckExpired }
      }
    };

    const errorHandler = new DefaultHttpClientErrorHandler(navigateMock);
    await errorHandler.handle(error, healthCheck);

    expect(recordErrorEventSpy).toHaveBeenCalledTimes(1);
    expect(recordErrorEventSpy).toHaveBeenCalledWith({
      eventType: RumEventType.HEALTH_CHECK_UNEXPECTED_STEP_ERROR,
      errorMessage: 'Unknown error',
      healthCheckId: healthCheck.id,
      patientId: healthCheck.patientId,
      errorDetails: {
        failureReason: HealthCheckUpdateErrorReason.HealthCheckExpired
      }
    });
    expect(navigateMock).toHaveBeenCalledWith(RoutePath.HealthCheckExpiredPage);
  });
});
