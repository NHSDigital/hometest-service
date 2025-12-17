import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { type IPatientInfoResponse } from '../../../lib/apiClients/backendApiResources/PatientApiResource';

const config: Config = ConfigFactory.getConfig();

test.describe('Backend API, patient endpoint', () => {
  test.skip(config.integratedEnvironment);
  test(
    'GET, Patient info',
    {
      tag: ['@api', '@get']
    },
    async ({ backendApiResource }) => {
      await test.step('Patient retrieves their info', async () => {
        const response = await backendApiResource.patient.getPatientInfo();
        const responseBody = (await response.json()) as IPatientInfoResponse;
        expect(response.status()).toEqual(200);
        expect(
          responseBody.termsAccepted,
          'Patient does not have terms accepted'
        ).toEqual(true);
      });
    }
  );

  test(
    'POST, Update patient info',
    {
      tag: ['@api', '@post']
    },
    async ({ backendApiResource }) => {
      await test.step('Patient updates their info', async () => {
        const update =
          await backendApiResource.patient.updatePatientInfo(false);
        expect(
          update.status(),
          'Update patient info failed, status code is not 200'
        ).toEqual(200);
        const response = await backendApiResource.patient.getPatientInfo();
        const responseBody = (await response.json()) as IPatientInfoResponse;
        expect(
          response.status(),
          'Failed to get patient info after update'
        ).toEqual(200);
        expect(
          responseBody.termsAccepted,
          'Terms accepted are not updated to false'
        ).toEqual(false);

        await backendApiResource.patient.updatePatientInfo(true);
      });
    }
  );
});
