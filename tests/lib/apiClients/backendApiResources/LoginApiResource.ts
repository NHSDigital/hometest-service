import { type APIResponse } from '@playwright/test';
import { BackendBaseApiResource } from './BackendBaseApiResource';

export class LoginApiResource extends BackendBaseApiResource {
  public async login(code: string, source: string): Promise<APIResponse> {
    return await this.backendApiResource.postRequest('/login', {
      code,
      source
    });
  }

  public async logout(authCookie: string): Promise<APIResponse> {
    return await this.backendApiResource.postRequest('/logout', undefined, {
      Cookie: `auth=${authCookie}`
    });
  }
}
