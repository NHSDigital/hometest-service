import { backendApiEndpoint, eventAuditMaxRetries } from '../settings';
import { httpClient } from '../lib/http/http-client';
import {
  type AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { rum } from '../lib/rum/rum-client';

export interface IEventAuditRequest {
  healthCheck?: IHealthCheck;
  patientId?: string;
  eventType: AuditEventType;
  details?: Record<string, boolean | number | string | null | undefined>;
}

interface UseAuditEventResult {
  triggerAuditEvent: (event: IEventAuditRequest) => Promise<void>;
}

export function useAuditEvent(): UseAuditEventResult {
  const triggerAuditEvent = async (
    event: IEventAuditRequest
  ): Promise<void> => {
    const maxRetries: number = eventAuditMaxRetries ? +eventAuditMaxRetries : 0;
    let retries = 0;
    let result = undefined;
    let nonRetriableError = undefined;

    do {
      try {
        result = await httpClient
          .postRequest<IEventAuditRequest, string>(
            `${backendApiEndpoint}/events`,
            {
              eventType: event.eventType,
              ...(event.healthCheck?.id && {
                healthCheckId: event.healthCheck.id
              }),
              ...(event.healthCheck?.dataModelVersion && {
                hcDataModelVersion: event.healthCheck?.dataModelVersion
              }),
              ...(event.details && { details: event.details })
            }
          )
          .then((response: string) => response);

        if (result !== undefined) {
          break;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (!error.response || error.response.status < 500) {
          nonRetriableError = error;
          break;
        }
      }

      retries += 1;
    } while (retries <= maxRetries);

    if (result === undefined && nonRetriableError === undefined) {
      await rum.recordAuditEventError({
        auditEventType: event.eventType,
        errorMessage: `Unable to make a successful audit event call after ${maxRetries + 1} attempts`,
        healthCheckId: event.healthCheck?.id,
        hcDataModelVersion: event.healthCheck?.dataModelVersion,
        patientId: event.patientId
      });
    } else if (nonRetriableError) {
      await rum.recordAuditEventError({
        auditEventType: event.eventType,
        errorMessage: 'Unable to make a successful audit event call',
        healthCheckId: event.healthCheck?.id,
        hcDataModelVersion: event.healthCheck?.dataModelVersion,
        patientId: event.patientId,
        errorDetails: nonRetriableError
      });
    }
  };

  return {
    triggerAuditEvent
  };
}
