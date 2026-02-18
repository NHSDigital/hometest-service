import { ConfigFactory } from './configuration/configuration';
import { CredentialsHelper } from './utils/CredentialsHelper';
import { UserManagerFactory } from './utils/users/UserManagerFactory';

async function globalSetup() {
  console.log('🚀 Global setup started');
  const _config = ConfigFactory.getConfig();
  console.log(`Tests will run on environment: ${process.env.ENV ?? 'local'}`);

    // Add user credentials to env variable
  await new CredentialsHelper().addCredentialsToEnvVariable();
  await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default globalSetup;
