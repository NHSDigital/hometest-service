import { test, expect } from '../../../fixtures/commonFixture';
import type { CognitoIdentityResponse } from '../../../lib/apiClients/HealthCheckModel';

test.describe('Backend API, rum identity endpoint', () => {
  test.describe('Rum identity endpoint positive scenarios', () => {
    test(
      'GET request, fetch RUM token',
      {
        tag: ['@api', '@get', '@rum-identity']
      },
      async ({ backendApiResource }) => {
        const response = await backendApiResource.rumIdentity.getRumIdentity();

        console.log(`GET response status code: ${response.status()}`);
        expect(response.status()).toEqual(200);

        const responseBody = (await response.json()) as CognitoIdentityResponse;
        const token: string = responseBody.token;
        const identityId: string = responseBody.identityId;
        expect(token).not.toBeUndefined();
        expect(identityId).not.toBeUndefined();
      }
    );
  });
});
