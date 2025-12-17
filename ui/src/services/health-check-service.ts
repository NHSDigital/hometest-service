import { backendApiEndpoint } from '../settings';
import { httpClient } from '../lib/http/http-client';
import {
  type IHealthCheck,
  type IHealthCheckAnswers
} from '@dnhc-health-checks/shared';

export interface IHealthCheckHttpResponse {
  healthCheck: IHealthCheck;
  status?: HttpCallStatus;
}

export interface IHealthCheckResult {
  healthCheck?: IHealthCheck;
  status: HttpCallStatus;
}

export interface IHealthChecksResult {
  healthChecks: IHealthCheck[];
  status: HttpCallStatus;
}

export enum HttpCallStatus {
  Successful = 'Successful',
  Failed = 'Failed',
  NotFound = 'NotFound',
  SessionExpired = 'SessionExpired'
}

export interface IHealthCheckService {
  getHealthCheckById: (id: string) => Promise<IHealthCheckResult>;
  getHealthChecksByToken: () => Promise<IHealthChecksResult>;
  runVersionMigration: (id: string) => Promise<HttpCallStatus>;
  updateHealthCheckQuestionnaireAnswers: (
    healthCheckId: string,
    questionnaireAnswers: Partial<IHealthCheckAnswers>
  ) => Promise<HttpCallStatus>;
  createHealthCheck: () => Promise<IHealthCheck>;
}

const healthCheckService: IHealthCheckService = {
  getHealthCheckById: async function (id: string): Promise<IHealthCheckResult> {
    const response = await httpClient.getRequest<IHealthCheckHttpResponse>(
      `${backendApiEndpoint}/hometest/${id}`
    );
    return {
      healthCheck: response.healthCheck,
      status: HttpCallStatus.Successful
    };
  },

  getHealthChecksByToken: async function (): Promise<IHealthChecksResult> {
    const response = await httpClient.getRequest<IHealthChecksResult>(
      `${backendApiEndpoint}/hometest`
    );
    if (response.healthChecks.length === 0) {
      return { status: HttpCallStatus.NotFound, healthChecks: [] };
    }

    return {
      healthChecks: response.healthChecks,
      status: HttpCallStatus.Successful
    };
  },

  updateHealthCheckQuestionnaireAnswers: async function (
    healthCheckId: string,
    questionnaireAnswers: Partial<IHealthCheckAnswers>
  ): Promise<HttpCallStatus> {
    await httpClient.postRequest(
      `${backendApiEndpoint}/hometest/${healthCheckId}/questionnaire`,
      questionnaireAnswers
    );
    return HttpCallStatus.Successful;
  },

  createHealthCheck: async function (): Promise<IHealthCheck> {
    const response = await httpClient.postRequest<
      object,
      { healthCheck: IHealthCheck }
    >(`${backendApiEndpoint}/hometest`, {});
    return response.healthCheck;
  },

  runVersionMigration: async function (id: string): Promise<HttpCallStatus> {
    await httpClient.postRequest(
      `${backendApiEndpoint}/hometest/${id}/version`,
      {}
    );
    return HttpCallStatus.Successful;
  }
};

export default healthCheckService;
