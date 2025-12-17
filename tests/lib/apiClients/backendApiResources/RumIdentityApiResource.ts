import { type APIResponse } from '@playwright/test';
import { BackendBaseApiResource } from './BackendBaseApiResource';

export class RumIdentityApiResource extends BackendBaseApiResource {
  public async getRumIdentity(): Promise<APIResponse> {
    return await this.backendApiResource.getRequest('/rum-identity');
  }
}
