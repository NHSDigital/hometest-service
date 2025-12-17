import { type Config, ConfigFactory } from '../../../env/config';
import { test, expect } from '../../../fixtures/commonFixture';
import {
  type CognitoIdentityResponse,
  type LoginOutput
} from '../../../lib/apiClients/HealthCheckModel';

const config: Config = ConfigFactory.getConfig();

test.describe('Backend API, login endpoint', () => {
  test.skip(config.integratedEnvironment);
  test(
    'Patient eligible without health check',
    {
      tag: ['@api', '@post']
    },
    async ({ backendApiResource, testedUser }) => {
      const response = await backendApiResource.login.login(
        testedUser.code as unknown as string,
        'browser'
      );
      expect(response.status()).toEqual(200);
      const body = (await response.json()) as CognitoIdentityResponse;
      expect(body).toHaveProperty('token', expect.any(String));
      expect(body).toHaveProperty('identityId', expect.any(String));
    }
  );
  test(
    'Patient ineligible due to being overage - 75 years',
    {
      tag: ['@api', '@post']
    },
    async ({ backendApiResource }) => {
      const response = await backendApiResource.login.login(
        'mock_code_ineligible_patient_overage_75_years',
        'browser'
      );
      expect(response.status()).toEqual(403);
      const body = (await response.json()) as LoginOutput;
      expect(body).toHaveProperty(
        'message',
        'Patient ineligible for healthcheck'
      );
      expect(body).toHaveProperty('reason', 'patient-over-required-age');
    }
  );

  test(
    'Patient ineligible due to being underage - 35 years',
    {
      tag: ['@api', '@post']
    },
    async ({ backendApiResource }) => {
      const response = await backendApiResource.login.login(
        'mock_code_ineligible_patient_underage_35_years',
        'browser'
      );
      expect(response.status()).toEqual(403);
      const body = (await response.json()) as LoginOutput;
      expect(body).toHaveProperty(
        'message',
        'Patient ineligible for healthcheck'
      );
      expect(body).toHaveProperty('reason', 'patient-under-required-age');
    }
  );
});
