import { type APIResponse } from '@playwright/test';
import { type BloodTestOrder } from '../HealthCheckModel';
import { BackendBaseApiResource } from './BackendBaseApiResource';
import type { IHealthCheckAnswers } from '@dnhc-health-checks/shared';

export class HealthCheckApiResource extends BackendBaseApiResource {
  public async getHealthCheckById(id: string): Promise<APIResponse> {
    return await this.backendApiResource.getRequest(`/health-checks/${id}`);
  }

  public async getHealthCheckUsingInvalidToken(
    id: string
  ): Promise<APIResponse> {
    return await this.backendApiResource.getRequestWithInvalidToken(
      `/health-checks/${id}`
    );
  }

  public async updateHealthCheck(
    id: string,
    testData: IHealthCheckAnswers
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      `/health-checks/${id}/questionnaire`,
      testData as Record<string, unknown>
    );
  }

  public async updateHealthCheckToLatestVersion(
    id: string
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      `/health-checks/${id}/version`
    );
  }

  public async getAllHealthChecks(): Promise<APIResponse> {
    return await this.backendApiResource.getRequest('/health-checks');
  }

  public async getAllHealthChecksUsingInvalidToken(): Promise<APIResponse> {
    return await this.backendApiResource.getRequestWithInvalidToken(
      '/health-checks/'
    );
  }

  public async initializeHealthCheck(): Promise<APIResponse> {
    return await this.backendApiResource.postRequest('/health-checks');
  }

  public async initializeHealthCheckUsingInvalidToken(): Promise<APIResponse> {
    return await this.backendApiResource.postRequestWithInvalidToken(
      '/health-checks'
    );
  }

  public async createGpUpdateScheduleItem(
    healthCheckId: string,
    gpUpdateScheduledReason: string
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      `/health-checks/${healthCheckId}/schedule-gp-update`,
      {
        scheduleReason: gpUpdateScheduledReason
      }
    );
  }

  public async orderLabTest(
    healthCheckId: string,
    testData: BloodTestOrder
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      `/health-checks/${healthCheckId}/blood-test`,
      testData as Record<string, unknown>
    );
  }

  public async submitHealthCheckQuestionnaire(
    id: string
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      `/health-checks/${id}/questionnaire/submit`
    );
  }
}
