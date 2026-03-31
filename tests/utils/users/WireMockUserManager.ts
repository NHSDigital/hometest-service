import * as fs from "node:fs";

import type { Page } from "@playwright/test";

import { BaseUserManager } from "./BaseUserManager";
import { SpecialUserKey } from "./SpecialUserKey";
import {
  type WireMockAuthUser,
  getWireMockAuthManifestPath,
  loadWireMockAuthManifest,
} from "./wiremockAuthMappings";

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
    const isFirefox = page.context().browser()?.browserType().name() === "firefox";

    await page.goto(`${this.config.uiBaseUrl}/login?login_hint=${loginHint}`, {
      waitUntil: isFirefox ? "domcontentloaded" : "commit",
    });

    // Firefox-specific: NS_BINDING_ABORTED errors during rapid OAuth redirects
    // Wait for the redirect chain to settle using a more reliable approach
    if (isFirefox) {
      // Poll until URL changes and settles on a non-intermediate page
      let lastUrl = "";
      let stableCount = 0;
      const maxAttempts = 150; // 15 seconds with 100ms intervals

      for (let i = 0; i < maxAttempts; i++) {
        await page.waitForTimeout(100);
        const currentUrl = page.url();

        if (currentUrl === lastUrl) {
          stableCount++;
          // URL stable for 3 checks (300ms) and not on intermediate page
          if (
            stableCount >= 3 &&
            !currentUrl.includes("/login") &&
            !currentUrl.includes("/callback")
          ) {
            return page;
          }
        } else {
          stableCount = 0;
          lastUrl = currentUrl;
        }
      }

      // Timeout: still on intermediate page
      throw new Error(`Firefox login timeout: still on ${page.url()} after ${maxAttempts * 100}ms`);
    } else {
      // Other browsers: standard waitForURL
      await page.waitForURL(
        (url) => !url.pathname.includes("/login") && !url.pathname.includes("/callback"),
        { timeout: 30000 },
      );
    }

    return page;
  }

  protected getSpecialUsers(): Map<SpecialUserKey, WireMockAuthUser> {
    return getManifestUsers().specialUsers;
  }
}
