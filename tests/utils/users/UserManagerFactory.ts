import {
  AuthType,
  ConfigFactory,
  type ConfigInterface,
} from "../../configuration/EnvironmentConfiguration";
import { getNumberOfWorkers } from "../../playwright.config";
import type { BaseTestUser } from "./BaseUser";
import type { BaseUserManager } from "./BaseUserManager";
import { SandBoxUserManager as SandboxUserManager } from "./SandBoxUserManager";
import { WireMockUserManager } from "./WireMockUserManager";

export class UserManagerFactory {
  private readonly config: ConfigInterface = ConfigFactory.getConfig();

  getUserManager(): BaseUserManager<BaseTestUser> {
    if (this.config.authType === AuthType.WIREMOCK) {
      console.log("Using WireMock-based authentication for local environment");
      return new WireMockUserManager(getNumberOfWorkers(this.config.authType));
    }
    return new SandboxUserManager(getNumberOfWorkers(this.config.authType));
  }
}
