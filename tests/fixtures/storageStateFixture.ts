import { test as baseTest } from '@playwright/test';
import type { BaseUserManager } from '../utils/users/BaseUserManager';
import { UserManagerFactory } from '../utils/users/UserManagerFactory';
import type { BaseTestUser } from '../utils/users/BaseUser';

const userManager = new UserManagerFactory().getUserManager();

export const storageStateFixture = baseTest.extend<
  object,
  {
    testedUser: BaseTestUser;
    workerStorageState: string;
    userManager: BaseUserManager<BaseTestUser>;
  }
>({
  // Use the same storage state for all tests in this worker.
  storageState: async ({ testedUser, workerStorageState }, use) => {
    console.log(`Test using user with nhsNumber: ${testedUser.nhsNumber}`);
    console.log(`Test start date : ${new Date().toISOString()}`);
    await use(workerStorageState);
  },
  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [
    async ({ }, use) => {
      console.log(
        `Creating new worker with index: ${storageStateFixture.info().parallelIndex}`
      );

      const fileName: string = userManager.getWorkerUserSessionFilePath(
        storageStateFixture.info().parallelIndex
      );
      console.log(`Test using session: ${fileName}`);
      await use(fileName);
    },
    { scope: 'worker' }
  ],
  userManager: [
    async ({ }, use) => {
      await use(userManager);
    },
    { scope: 'worker' }
  ],
  testedUser: [
    async ({ }, use) => {
      const user: BaseTestUser = userManager.getWorkerUser(
        storageStateFixture.info().parallelIndex
      );

      // Validate that required user properties exist
      if (!user.nhsNumber || !user.dob) {
        throw new Error(
          `Test user is missing required properties. nhsNumber: ${user.nhsNumber}, dob: ${user.dob}. User: ${JSON.stringify(user)}`
        );
      }

      console.log(`Using user with nhsNumber: ${user.nhsNumber}`);
      await use(user);
    },
    { scope: 'worker' }
  ]
});
