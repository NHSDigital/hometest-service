import { test as base } from "@playwright/test";

import { setTestLogContext } from "../utils/testLogContext";
import { UserManagerFactory } from "../utils/users";

let userManagerFactory: UserManagerFactory | undefined;
function getUserManagerFactory(): UserManagerFactory {
  userManagerFactory ??= new UserManagerFactory();
  return userManagerFactory;
}

type UserManager = ReturnType<UserManagerFactory["getUserManager"]>;
let userManager: UserManager | undefined;
function getUserManager(): UserManager {
  userManager ??= getUserManagerFactory().getUserManager();
  return userManager;
}

export const logContextFixture = base.extend<{ logContext: void }>({
  logContext: [
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
