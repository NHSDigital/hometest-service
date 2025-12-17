import { type APIResponse } from '@playwright/test';
import { type AuditEventBody } from '../HealthCheckModel';
import { BackendBaseApiResource } from './BackendBaseApiResource';

export class EventsApiResource extends BackendBaseApiResource {
  public async createAuditEvent(
    testData: AuditEventBody
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest('/events', testData);
  }
}
