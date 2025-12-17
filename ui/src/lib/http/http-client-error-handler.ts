import { type NavigateFunction } from 'react-router-dom';
import { RoutePath } from '../models/route-paths';
import { RumEventType } from '../models/rum-event-type';
import { rum } from '../rum/rum-client';
import {
  type IHealthCheck,
  HealthCheckUpdateErrorReason
} from '@dnhc-health-checks/shared';

interface ErrorWithFailureReason {
  response?: {
    data?: {
      failureReason?: HealthCheckUpdateErrorReason;
    };
  };
}

export class DefaultHttpClientErrorHandler {
  readonly navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  async handle(error: unknown, healthCheck?: IHealthCheck): Promise<void> {
    const errorMessage =
      error instanceof Error && error.message ? error.message : 'Unknown error';
    const failureReason = (error as ErrorWithFailureReason)?.response?.data
      ?.failureReason;

    const isExpired =
      failureReason === HealthCheckUpdateErrorReason.HealthCheckExpired;
    const eventType = isExpired
      ? RumEventType.HEALTH_CHECK_UNEXPECTED_STEP_ERROR
      : RumEventType.UNEXPECTED_ERROR;
    const route = isExpired
      ? RoutePath.HealthCheckExpiredPage
      : RoutePath.UnexpectedErrorPage;

    await rum.recordErrorEvent({
      eventType,
      errorMessage,
      healthCheckId: healthCheck?.id,
      patientId: healthCheck?.patientId,
      errorDetails: { failureReason }
    });

    this.navigate(route);
  }
}
