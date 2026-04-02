import { test as base } from "@playwright/test";

import { setTestLogContext } from "../utils/testLogContext";
import { UserManagerFactory } from "../utils/users";

let _userManagerFactory: UserManagerFactory | undefined;
function getUserManagerFactory(): UserManagerFactory {
  _userManagerFactory ??= new UserManagerFactory();
  return _userManagerFactory;
}

type UserManager = ReturnType<UserManagerFactory["getUserManager"]>;
let _userManager: UserManager | undefined;
function getUserManager(): UserManager {
  _userManager ??= getUserManagerFactory().getUserManager();
  return _userManager;
}

export const logContextFixture = base.extend<{ _logContext: void }>({
  _logContext: [
    async ({}, use) => {
      const info = base.info();
      const workerIndex = info.parallelIndex ?? 0;
      const nhsNumber = getUserManager().getWorkerUser(workerIndex).nhsNumber ?? "n/a";
      setTestLogContext({
        worker: `Worker-${workerIndex + 1}`,
        testTitle: info.title,
        nhsNumber,
        browser: info.project.name,
      });
      await use();
    },
    { auto: true },
  ],
});
