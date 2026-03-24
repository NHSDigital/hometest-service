import { BaseUserManager } from "./BaseUserManager";
import * as fs from "node:fs";
import type { Page } from "@playwright/test";
import { SpecialUserKey } from "./SpecialUserKey";
import {
  getWireMockAuthManifestPath,
  loadWireMockAuthManifest,
  type WireMockAuthUser,
} from "./WiremockAuthMappings";

const WIREMOCK_LOGIN_HINT_STORAGE_KEY = "wiremockLoginHint";

function getManifestUsers(): {
  workerUsers: WireMockAuthUser[];
  specialUsers: Map<SpecialUserKey, WireMockAuthUser>;
} {
  const manifestPath = getWireMockAuthManifestPath();
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `WireMock auth manifest not found at ${manifestPath}. Global setup must create it before workers start.`,
    );
  }

  const manifest = loadWireMockAuthManifest();

  return {
    workerUsers: manifest.workerUsers,
    specialUsers: new Map(
      Object.entries(manifest.specialUsers) as Array<[SpecialUserKey, WireMockAuthUser]>,
    ),
  };
}

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
export class WireMockUserManager extends BaseUserManager<WireMockAuthUser> {
  protected override async isSessionValid(sessionFilePath: string): Promise<boolean> {
    const baseSessionIsValid = await super.isSessionValid(sessionFilePath);
    if (!baseSessionIsValid) {
      return false;
    }

    try {
      const content = await import("node:fs/promises").then(({ readFile }) =>
        readFile(sessionFilePath, "utf8"),
      );
      const session = JSON.parse(content) as {
        origins?: Array<{
          origin: string;
          localStorage?: Array<{ name: string; value: string }>;
        }>;
      };

      const uiOrigin = new URL(this.config.uiBaseUrl).origin;
      const uiStorage = session.origins?.find((origin) => origin.origin === uiOrigin);

      return Boolean(
        uiStorage?.localStorage?.some(({ name }) => name === WIREMOCK_LOGIN_HINT_STORAGE_KEY),
      );
    } catch {
      return false;
    }
  }

  public getWorkerUsers(): WireMockAuthUser[] {
    return getManifestUsers().workerUsers;
  }

  protected async loginWorkerUser(user: WireMockAuthUser, page: Page): Promise<Page> {
    const loginHint = encodeURIComponent(user.nhsNumber ?? user.authContext.sub);

    await page.goto(`${this.config.uiBaseUrl}/login?login_hint=${loginHint}`);
    // Wait until the OAuth redirect chain completes:
    // /login → WireMock /authorize → /callback → post-login page
    await page.waitForURL(
      (url) => !url.pathname.includes("/login") && !url.pathname.includes("/callback"),
      { timeout: 30000 },
    );
    return page;
  }

  protected getSpecialUsers(): Map<SpecialUserKey, WireMockAuthUser> {
    return getManifestUsers().specialUsers;
  }
}
