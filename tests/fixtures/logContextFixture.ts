import { test as base } from "@playwright/test";

import { setTestLogContext } from "../utils/testLogContext";
import { UserManagerFactory } from "../utils/users";

let _userManagerFactory: UserManagerFactory | undefined;
function getUserManagerFactory(): UserManagerFactory {
  _userManagerFactory ??= new UserManagerFactory();
  return _userManagerFactory;
}

export const logContextFixture = base.extend<{ _logContext: void }>({
  _logContext: [
    async ({}, use) => {
      const info = base.info();
      const workerIndex = info.parallelIndex ?? 0;
      const nhsNumber =
        getUserManagerFactory().getUserManager().getWorkerUser(workerIndex).nhsNumber ?? "n/a";
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
