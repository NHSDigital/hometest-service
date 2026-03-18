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
  public getWorkerUsers(): NHSLoginMockedUser[] {
    return [DEFAULT_WORKER_USER];
  }

  protected async loginWorkerUser(_user: NHSLoginMockedUser, page: Page): Promise<Page> {
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
    return new Map([[SpecialUserKey.UNDER_18, UNDER_18_USER]]);
  }
}
