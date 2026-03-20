import { CredentialsHelper } from "./utils/CredentialsHelper";
import { UserManagerFactory } from "./utils/users/UserManagerFactory";
import { ConfigFactory } from "./configuration/EnvironmentConfiguration";

async function globalSetup() {
  console.log("🚀 Global setup started");
  console.log(`Tests will run on environment: ${process.env.ENV ?? "local"}`);

  const config = ConfigFactory.getConfig();
  if (!config.useWiremockAuth) {
    // Only load NHS Login credentials when using the real login flow
    await new CredentialsHelper().addCredentialsToEnvVariable();
  }

 // await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default globalSetup;
