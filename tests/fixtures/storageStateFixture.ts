import { test as baseTest } from "@playwright/test";

import { setTestLogContext } from "../utils/testLogContext";
import { type BaseTestUser, type BaseUserManager, UserManagerFactory } from "../utils/users";

let _userManager: BaseUserManager<BaseTestUser> | undefined;
function getUserManager(): BaseUserManager<BaseTestUser> {
  _userManager ??= new UserManagerFactory().getUserManager();
  return _userManager;
}

function getWorkerIndex(): number {
  return storageStateFixture.info().parallelIndex ?? 0;
}

export const storageStateFixture = baseTest.extend<
  object,
  {
    testedUser: BaseTestUser;
    workerStorageState: string;
    userManager: BaseUserManager<BaseTestUser>;
  }
>({
  storageState: async ({ testedUser, workerStorageState }, use) => {
    const worker = `Worker-${getWorkerIndex() + 1}`;
    const info = storageStateFixture.info();
    setTestLogContext({
      worker,
      testTitle: info.title,
      nhsNumber: testedUser.nhsNumber ?? "unknown",
      browser: info.project.name,
    });
    console.log(
      `[${worker}] "${info.title}" | nhsNumber: ${testedUser.nhsNumber} | started: ${new Date().toISOString()}`,
    );
    await use(workerStorageState);
  },
  workerStorageState: [
    async ({}, use) => {
      const workerIndex = getWorkerIndex();
      console.log(`Creating new worker with index: ${workerIndex}`);

      const fileName: string = getUserManager().getWorkerUserSessionFilePath(workerIndex);
      console.log(`Test using session: ${fileName}`);
      await use(fileName);
    },
    { scope: "worker" },
  ],
  userManager: [
    async ({}, use) => {
      await use(getUserManager());
    },
    { scope: "worker" },
  ],
  testedUser: [
    async ({}, use) => {
      const user: BaseTestUser = getUserManager().getWorkerUser(getWorkerIndex());

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
