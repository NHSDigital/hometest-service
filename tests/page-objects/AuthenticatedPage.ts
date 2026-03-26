import { Locator, Page } from "@playwright/test";

import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { BasePage } from "./BasePage";

export abstract class AuthenticatedPage extends BasePage {
  private static readonly loginPath = "/login";
  private static readonly callbackPath = "/callback";
  private static readonly serviceErrorPath = "/service-error";
  private static readonly initialRenderTimeoutMs = 10000;
  private static readonly protectedRouteTimeoutMs = 30000;

  readonly config: ConfigInterface;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
  }

  private getCurrentRoute(url: URL): string {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  private isExpectedPath(route: string, expectedPaths: readonly string[]): boolean {
    return expectedPaths.includes(route);
  }

  private isBootstrapPath(pathname: string): boolean {
    return pathname === AuthenticatedPage.loginPath || pathname === AuthenticatedPage.callbackPath;
  }

  private async waitForProtectedRoute(
    path: string,
    readyLocator: Locator,
    expectedPaths: readonly string[],
  ): Promise<void> {
    try {
      await Promise.race([
        readyLocator.waitFor({
          state: "visible",
          timeout: AuthenticatedPage.initialRenderTimeoutMs,
        }),
        this.page.waitForURL(
          (url) => {
            const { pathname } = url;
            return (
              this.isBootstrapPath(pathname) || pathname === AuthenticatedPage.serviceErrorPath
            );
          },
          { timeout: AuthenticatedPage.initialRenderTimeoutMs, waitUntil: "commit" },
        ),
      ]);
    } catch {
      // Fall through to explicit route and locator validation below.
    }

    const currentUrl = new URL(this.page.url());
    const currentRoute = this.getCurrentRoute(currentUrl);
    const currentPathname = currentUrl.pathname;

    if (currentPathname === AuthenticatedPage.serviceErrorPath) {
      throw new Error(
        `Navigation ended on ${AuthenticatedPage.serviceErrorPath} instead of ${path}`,
      );
    }

    if (this.isBootstrapPath(currentPathname)) {
      throw new Error(
        `Expected authenticated navigation to ${path}, but the app redirected to ${currentRoute}. The saved Playwright session is missing or invalid.`,
      );
    }

    if (!this.isExpectedPath(currentRoute, expectedPaths)) {
      throw new Error(
        `Navigation ended on ${currentRoute} instead of one of ${expectedPaths.join(", ")}`,
      );
    }

    await readyLocator.waitFor({
      state: "visible",
      timeout: AuthenticatedPage.protectedRouteTimeoutMs,
    });
  }

  protected async navigateToProtectedPath(
    path: string,
    readyLocator: Locator,
    expectedPaths: readonly string[] = [path],
  ): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}${path}`);
    await this.waitForProtectedRoute(path, readyLocator, expectedPaths);
  }
}
