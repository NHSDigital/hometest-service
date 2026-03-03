import { AuthType, ConfigFactory, type ConfigInterface } from '../../configuration/EnvironmentConfiguration';
import { getNumberOfWorkers } from '../../playwright.config';
import { SandBoxUserManager as SandboxUserManager } from './SandBoxUserManager';
import type { BaseTestUser } from './BaseUser';
import type { BaseUserManager } from './BaseUserManager';


export class UserManagerFactory {
  private readonly config: ConfigInterface = ConfigFactory.getConfig();

  getUserManager(): BaseUserManager<BaseTestUser> {

     return new SandboxUserManager(getNumberOfWorkers(this.config.authType));
      }

}
