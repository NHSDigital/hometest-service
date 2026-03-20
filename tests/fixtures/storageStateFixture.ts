import { test as baseTest } from "@playwright/test";
import type { BaseUserManager } from "../utils/users/BaseUserManager";
import { UserManagerFactory } from "../utils/users/UserManagerFactory";
import { BaseTestUser } from "../utils/users/BaseUser";
import { ConfigFactory } from "../configuration/EnvironmentConfiguration";

const userManager = new UserManagerFactory().getUserManager();

function getWorkerIndex(): number {
  return userManagementFixture.info().parallelIndex ?? 0;
}

// Provides user management fixtures (always used).
export const userManagementFixture = baseTest.extend<
  object,
  {
    testedUser: BaseTestUser;
    workerStorageState: string;
    userManager: BaseUserManager<BaseTestUser>;
  }
>({
  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [
    async ({}, use) => {
      const workerIndex = getWorkerIndex();
      console.log(`Creating new worker with index: ${workerIndex}`);

      const fileName: string = userManager.getWorkerUserSessionFilePath(workerIndex);
      console.log(`Test using session: ${fileName}`);
      await use(fileName);
    },
    { scope: "worker" },
  ],
  userManager: [
    async ({}, use) => {
      await use(userManager);
    },
    { scope: "worker" },
  ],
  testedUser: [
    async ({}, use) => {
      if (ConfigFactory.getConfig().useWiremockAuth) {
        await use(new BaseTestUser());
        return;
      }

      const user: BaseTestUser = userManager.getWorkerUser(getWorkerIndex());

      // Validate that required user properties exist
      if (!user.nhsNumber || !user.dob) {
        throw new Error(
          `Test user is missing required properties. nhsNumber: ${user.nhsNumber}, dob: ${user.dob}. User: ${JSON.stringify(user)}`,
        );
      }

      console.log(`Using user with nhsNumber: ${user.nhsNumber}`);
      await use(user);
    },
    { scope: "worker" },
  ],
});

// Extends userManagementFixture with the storageState override (only used when wiremock is off).
export const storageStateFixture = userManagementFixture.extend<object>({
  storageState: async ({ testedUser, workerStorageState }, use) => {
    console.log(`Test using user with nhsNumber: ${testedUser.nhsNumber}`);
    console.log(`Test start date : ${new Date().toISOString()}`);
    await use(workerStorageState);
  },
});
