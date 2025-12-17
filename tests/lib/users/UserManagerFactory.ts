import { AuthType, ConfigFactory, type Config } from '../../env/config';
import { getNumberOfWorkers } from '../../playwright.config';
import { AosUserManager } from './AosUserManager';
import type { BaseTestUser } from './BaseUser';
import type { BaseUserManager } from './BaseUserManager';
import { MockUserManager } from './MockUserManager';
import { SandpitUserManager } from './SandpitUserManager';

export class UserManagerFactory {
  private readonly config: Config = ConfigFactory.getConfig();

  getUserManager(): BaseUserManager<BaseTestUser> {
    switch (this.config.authType) {
      case AuthType.MOCKED: {
        return new MockUserManager(getNumberOfWorkers(this.config.authType));
      }
      case AuthType.SANDPIT: {
        return new SandpitUserManager(getNumberOfWorkers(this.config.authType));
      }
      case AuthType.AOS: {
        return new AosUserManager(getNumberOfWorkers(this.config.authType));
      }
    }
  }
}
