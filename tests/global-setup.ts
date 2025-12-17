import { ConfigFactory } from './env/config';
import { CredentialsHelper } from './lib/CredentialsHelper';
import { ParameterStoreService } from './lib/aws/parameterStore/ParameterStoreService';
import { UserManagerFactory } from './lib/users/UserManagerFactory';

async function createAuthorizationCookieJson(): Promise<void> {
  process.env.GLOBAL_START_TIME = new Date().toISOString();
  console.log(`Tests will run on environment: ${process.env.ENV ?? 'develop'}`);
  const config = ConfigFactory.getConfig();
  const parameterStoreService = new ParameterStoreService();

  // Turn on email notifications to GP
  if (config.verifyEmails) {
    await parameterStoreService.updateEmailToGp(true);
  }

  // Turn on PDM Integration
  await parameterStoreService.updatePdmIntegration(true);

  // Turn on MNS Integration
  await parameterStoreService.updateMnsIntegration(
    config.mnsIntegrationEnabled
  );

  // Turn on HC Expiry Notification
  if (config.autoExpiryEnabled) {
    await parameterStoreService.updateHCExpiryNotification(true);
  }

  // download certificates
  await new CredentialsHelper().getMtlsSecretsAndSaveCertificates();

  // Add user credentials to env variable
  await new CredentialsHelper().addCredentialsToEnvVariable();

  await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default createAuthorizationCookieJson;
