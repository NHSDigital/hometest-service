import { CredentialsHelper } from './utils/CredentialsHelper';
import { UserManagerFactory } from './utils/users/UserManagerFactory';

async function globalSetup() {
  if (process.env.DB_ONLY === 'true') {
    console.log('Skipping global login for DB-only tests');
    return;
  }
  console.log('🚀 Global setup started');
  console.log(`Tests will run on environment: ${process.env.ENV ?? 'local'}`);

    // Add user credentials to env variable
  await new CredentialsHelper().addCredentialsToEnvVariable();
  await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default globalSetup;
