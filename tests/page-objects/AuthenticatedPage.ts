import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";

export abstract class AuthenticatedPage extends BasePage {
  private static readonly loginPath = "/login";
  private static readonly callbackPath = "/callback";
  private static readonly serviceErrorPath = "/service-error";
  private static readonly initialRenderTimeoutMs = 10000;

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

  private async bootstrapViaLogin(
    returnToPath: string,
    expectedPaths: readonly string[],
  ): Promise<void> {
    const returnTo = encodeURIComponent(returnToPath);
    await this.page.goto(
      `${this.config.uiBaseUrl}${AuthenticatedPage.loginPath}?returnTo=${returnTo}`,
    );

    await this.page.waitForURL(
      (url) => {
        const route = this.getCurrentRoute(url);
        return (
          this.isExpectedPath(route, expectedPaths) ||
          url.pathname === AuthenticatedPage.serviceErrorPath
        );
      },
      { timeout: 30000, waitUntil: "commit" },
    );

    const finalUrl = new URL(this.page.url());
    if (finalUrl.pathname === AuthenticatedPage.serviceErrorPath) {
      throw new Error(
        `Login bootstrap ended on ${AuthenticatedPage.serviceErrorPath} instead of one of ${expectedPaths.join(", ")}`,
      );
    }
  }

  private async waitForProtectedRoute(
    path: string,
    readyLocator: Locator,
    expectedPaths: readonly string[],
  ): Promise<boolean> {
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
      return false;
    }

    const currentUrl = new URL(this.page.url());
    const currentPathname = currentUrl.pathname;

    if (currentPathname === AuthenticatedPage.serviceErrorPath) {
      throw new Error(
        `Navigation ended on ${AuthenticatedPage.serviceErrorPath} instead of ${path}`,
      );
    }

    if (this.isBootstrapPath(currentPathname)) {
      await this.page.waitForURL(
        (url) => {
          const route = this.getCurrentRoute(url);
          return (
            this.isExpectedPath(route, expectedPaths) ||
            url.pathname === AuthenticatedPage.serviceErrorPath
          );
        },
        { timeout: 30000, waitUntil: "commit" },
      );

      const finalUrl = new URL(this.page.url());
      if (finalUrl.pathname === AuthenticatedPage.serviceErrorPath) {
        throw new Error(
          `Navigation ended on ${AuthenticatedPage.serviceErrorPath} instead of ${path}`,
        );
      }
    }

    if (!this.isExpectedPath(this.getCurrentRoute(new URL(this.page.url())), expectedPaths)) {
      return false;
    }

    if (!(await readyLocator.isVisible())) {
      return false;
    }

    return true;
  }

  protected async navigateToProtectedPath(
    path: string,
    readyLocator: Locator,
    expectedPaths: readonly string[] = [path],
  ): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}${path}`);

    if (await this.waitForProtectedRoute(path, readyLocator, expectedPaths)) {
      return;
    }

    await this.bootstrapViaLogin(path, expectedPaths);

    if (await this.waitForProtectedRoute(path, readyLocator, expectedPaths)) {
      return;
    }

    throw new Error(
      `Failed to reach protected route ${path} after explicit login bootstrap; expected one of ${expectedPaths.join(", ")}`,
    );
  }
}
