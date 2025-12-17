import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { extractAuthCookies } from '../../../lib/apiClients/apiAuthorizer';
import type { NHSLoginMockedUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

const config: Config = ConfigFactory.getConfig();
let userForLogoutPurposes: NHSLoginMockedUser;

test.describe('Backend API, logout endpoint', () => {
  test.skip(config.integratedEnvironment);
  test(
    'Patient logout',
    { tag: ['@api', '@post'] },
    async ({ backendApiResource, userManager }) => {
      let cookieMap: Record<string, string> = {};
      userForLogoutPurposes = userManager.getSpecialUser(
        SpecialUserKey.PATIENT_FOR_LOGOUT_API_TEST
      ) as NHSLoginMockedUser;

      await test.step('Patient logs in', async () => {
        const loginResponse = await backendApiResource.login.login(
          userForLogoutPurposes.code,
          'browser'
        );
        cookieMap = extractAuthCookies(loginResponse);
      });

      await test.step('Patient logs out', async () => {
        const response = await backendApiResource.login.logout(
          cookieMap['auth']
        );
        expect(response.status(), 'Patient failed logging out').toEqual(200);
      });
    }
  );
});
