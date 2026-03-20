import { BaseUserManager } from "./BaseUserManager";
import type { NHSLoginMockedUser } from "./BaseUser";
import type { Page } from "@playwright/test";
import { SpecialUserKey } from "./SpecialUserKey";

const DEFAULT_WORKER_USER: NHSLoginMockedUser = {
  nhsNumber: "9912003071",
  dob: "1990-01-01",
  code: "wiremock-auth-code",
};

const UNDER_18_USER: NHSLoginMockedUser = {
  nhsNumber: "9686883932",
  dob: "2009-04-06",
  age: 16,
  code: "wiremock-auth-code",
};

/**
 * User manager that authenticates via the WireMock-simulated NHS Login flow.
 *
 * The UI's LoginPage redirects to the local WireMock /authorize endpoint
 * (configured via NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL), which immediately
 * 302-redirects back to /callback with a mock auth code. The backend /login
 * lambda then exchanges that code using WireMock-stubbed /token and /userinfo
 * endpoints.
 *
 * The browser-based flow ensures CSRF state, session storage, and auth cookies
 * are all handled naturally — no manual injection required.
 * BaseUserManager handles the browser lifecycle and storage state save.
 */
export class WireMockUserManager extends BaseUserManager<NHSLoginMockedUser> {
  private createRandomAdultUser(): NHSLoginMockedUser {
    const minAdultAge = 19;
    const maxAdultAge = 90;
    const age = Math.floor(Math.random() * (maxAdultAge - minAdultAge + 1)) + minAdultAge;

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    const dobString = dob.toISOString().split("T")[0];

    const nhsNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    return {
      nhsNumber,
      dob: dobString,
      age,
      code: "wiremock-auth-code",
    };
  }

  private createRandomUnder18User(): NHSLoginMockedUser {
    const minUnder18Age = 14;
    const maxUnder18Age = 17;
    const age = Math.floor(Math.random() * (maxUnder18Age - minUnder18Age + 1)) + minUnder18Age;

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    const dobString = dob.toISOString().split("T")[0];

    const nhsNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    return {
      nhsNumber,
      dob: dobString,
      age,
      code: "wiremock-auth-code",
    };
  }

  public getWorkerUsers(): NHSLoginMockedUser[] {
    return [DEFAULT_WORKER_USER];
  }

  protected async loginWorkerUser(_user: NHSLoginMockedUser, page: Page): Promise<Page> {
      const context = page.context();
      await context.clearCookies();
      await context.clearPermissions();
    await page.goto(`${this.config.uiBaseUrl}/login`);
    // Wait until the OAuth redirect chain completes:
    // /login → WireMock /authorize → /callback → post-login page
    await page.waitForURL(
      (url) => !url.pathname.includes("/login") && !url.pathname.includes("/callback"),
      { timeout: 30000 },
    );
    return page;
  }


  protected getSpecialUsers(): Map<SpecialUserKey, NHSLoginMockedUser> {
    const specialUsersMap = new Map<SpecialUserKey, NHSLoginMockedUser>();
    specialUsersMap.set(SpecialUserKey.RANDOM, this.createRandomAdultUser());
    specialUsersMap.set(SpecialUserKey.UNDER_18, this.createRandomUnder18User());
    return specialUsersMap;
  }
}
