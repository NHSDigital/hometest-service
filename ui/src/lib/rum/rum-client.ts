import { AwsRum } from 'aws-rum-web';
import { appMonitorId, backendApiEndpoint, nhtVersion } from '../../settings';
import { fromCognitoIdentity } from '@aws-sdk/credential-providers';
import { RumEventType } from '../models/rum-event-type';
import { type AuditEventType } from '@dnhc-health-checks/shared';
import { httpClient } from '../../lib/http/http-client';

const region = 'eu-west-2';

interface RumEventData {
  eventType: RumEventType;
  additionalData?: object;
  healthCheckId?: string;
  patientId?: string;
}

interface AuditErrorRumEventData {
  auditEventType: AuditEventType;
  errorMessage: string;
  errorDetails?: unknown;
  healthCheckId?: string;
  hcDataModelVersion?: string;
  patientId?: string;
}

interface ErrorEventData {
  eventType: RumEventType;
  errorMessage: string;
  errorDetails?: unknown;
  healthCheckId?: string;
  patientId?: string;
}

export interface CognitoIdentityResponse {
  token: string;
  identityId: string;
}

class RumClient {
  private awsRum: AwsRum | null = null;
  private enabled = false;
  private token: string | null = null;

  public enable(token: string, identityId: string): void {
    this.awsRum ??= new AwsRum(appMonitorId, nhtVersion, region, {
      allowCookies: false,
      endpoint: 'https://dataplane.rum.eu-west-2.amazonaws.com',
      sessionSampleRate: 1,
      telemetries: [],
      enableXRay: false,
      enableRumClient: false,
      disableAutoPageView: true
    });

    this.awsRum.setAwsCredentials(
      fromCognitoIdentity({
        identityId,
        logins: {
          'cognito-identity.amazonaws.com': token
        },
        clientConfig: { region }
      })
    );

    this.awsRum.enable();
    this.enabled = true;
    this.token = token;
  }

  public async recordEvent(eventData: RumEventData): Promise<void> {
    if (!this.enabled || !this.awsRum || !this.token) {
      await this.refreshToken();
    }

    if (this.enabled && this.awsRum) {
      this.awsRum.recordEvent(eventData.eventType, {
        ...(eventData.healthCheckId && {
          healthCheckId: eventData.healthCheckId
        }),
        ...(eventData.patientId && { patientId: eventData.patientId }),
        ...eventData.additionalData
      });
    } else {
      console.warn('Cannot use AWS RUM before enabling it.');
    }
  }

  public async recordAuditEventError(
    data: AuditErrorRumEventData
  ): Promise<void> {
    await this.recordEvent({
      eventType: RumEventType.EVENT_AUDIT_ERROR,
      healthCheckId: data.healthCheckId,
      patientId: data.patientId,
      additionalData: {
        auditEventType: data.auditEventType,
        errorMessage: data.errorMessage,
        ...(data.errorDetails !== undefined && {
          errorDetails: JSON.stringify(data.errorDetails)
        })
      }
    });
  }

  public async recordErrorEvent(data: ErrorEventData): Promise<void> {
    await this.recordEvent({
      eventType: data.eventType,
      healthCheckId: data.healthCheckId,
      patientId: data.patientId,
      additionalData: {
        errorMessage: data.errorMessage,
        ...(data.errorDetails !== undefined && {
          errorDetails: JSON.stringify(data.errorDetails)
        })
      }
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private async refreshToken(): Promise<void> {
    try {
      const responseData = await httpClient.getRequest<CognitoIdentityResponse>(
        `${backendApiEndpoint}/rum-identity`
      );

      this.enable(responseData.token, responseData.identityId);
    } catch (error) {
      console.error('Error refreshing AWS RUM token', error);
    }
  }
}

export const rum = new RumClient();
