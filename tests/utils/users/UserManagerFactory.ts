import { ConfigFactory, type ConfigInterface } from "../../configuration/EnvironmentConfiguration";
import { getNumberOfWorkers } from "../../playwright.config";
import { SandBoxUserManager as SandboxUserManager } from "./SandBoxUserManager";
import { WireMockUserManager } from "./WireMockUserManager";
import type { BaseTestUser } from "./BaseUser";
import type { BaseUserManager } from "./BaseUserManager";

export class UserManagerFactory {
  private readonly config: ConfigInterface = ConfigFactory.getConfig();

  getUserManager(): BaseUserManager<BaseTestUser> {
    if (this.config.useWiremockAuth) {
      console.log("Using WireMock-based authentication for local environment");
      return new WireMockUserManager(1);
    }
    return new SandboxUserManager(getNumberOfWorkers(this.config.authType));
  }
}
