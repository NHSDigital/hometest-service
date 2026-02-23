import * as fs from 'fs';
import * as path from 'path';
import { ConfigFactory } from './configuration/configuration';
import { CredentialsHelper } from './utils/CredentialsHelper';
import { UserManagerFactory } from './utils/users/UserManagerFactory';

async function globalSetup() {
  console.log('🚀 Global setup started');
  console.log(`Tests will run on environment: ${process.env.ENV ?? 'local'}`);

  // Add user credentials to env variable
  await new CredentialsHelper().addCredentialsToEnvVariable();

  // Check if we should skip login (for reusing existing sessions)
  if (process.env.SKIP_LOGIN === 'true') {
    const sessionDir = path.resolve(__dirname, '.session-cache');
    if (fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0) {
      console.log('⏭️ SKIP_LOGIN=true - Reusing existing session files');
      return;
    }
    console.log('⚠️ SKIP_LOGIN=true but no session files found, proceeding with login');
  }

  await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default globalSetup;
