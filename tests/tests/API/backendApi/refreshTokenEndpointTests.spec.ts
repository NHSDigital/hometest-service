import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { extractAuthCookies } from '../../../lib/apiClients/apiAuthorizer';
import type { APIResponse } from '@playwright/test';

const config: Config = ConfigFactory.getConfig();

test.describe('Backend API, refresh token endpoint', () => {
  test.skip(config.integratedEnvironment);
  let cookieMap: Record<string, string> = {};
  test.beforeEach(async ({ backendApiResource, testedUser }) => {
    const loginResponse = await backendApiResource.login.login(
      testedUser.code as unknown as string,
      'browser'
    );
    cookieMap = extractAuthCookies(loginResponse);
  });

  test(
    'POST request, refreshing token with valid cookies, returns new access and refresh tokens',
    { tag: ['@api', '@post', '@auth', '@refresh-token'] },
    async ({ backendApiResource }) => {
      const response: APIResponse =
        await backendApiResource.auth.refreshAuthToken(
          cookieMap['auth'],
          cookieMap['auth_refresh']
        );
      expect(
        response.status(),
        'Access has not been refreshed successfully'
      ).toBe(200);
    }
  );

  test(
    'POST request, refreshing token with invalid refresh cookies, returns unauthorized',
    { tag: ['@api', '@post', '@auth', '@refresh-token'] },
    async ({ backendApiResource }) => {
      const authRefreshCookie = 'invalid-refresh-token';
      const response: APIResponse =
        await backendApiResource.auth.refreshAuthToken(
          cookieMap['auth'],
          authRefreshCookie
        );
      expect(
        response.status(),
        'Access should be denied with invalid token'
      ).toBe(401);
    }
  );
});
