import type { APIResponse } from '@playwright/test';
import { BackendBaseApiResource } from './BackendBaseApiResource';

export class AuthenticationApiResource extends BackendBaseApiResource {
  public async refreshAuthToken(
    authCookie: string,
    authRefreshCookie: string
  ): Promise<APIResponse> {
    return await this.backendApiResource.postRequest(
      '/refresh-token',
      undefined,
      {
        Cookie: `auth=${authCookie}; auth_refresh=${authRefreshCookie}`
      }
    );
  }
}
