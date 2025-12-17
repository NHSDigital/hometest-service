import { type Locator, type Page } from 'playwright';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class WafErrorPage extends HTCPage {
  readonly pageContainer: Locator;
  readonly pageHeader: Locator;
  readonly nhsHeaderLink: Locator;
  readonly firewallBlockMessage: Locator;
  readonly nhs111Text: Locator;
  readonly nhs111Link: Locator;

  constructor(page: Page) {
    super(page);
    this.pageContainer = page.locator('#access-denied-page');
    this.pageHeader = page.locator('h1:has-text("Sorry, there is a problem")');
    this.nhsHeaderLink = page.locator('a.nhsuk-header__link');
    this.firewallBlockMessage = page.locator('p', {
      hasText: 'It looks like your request was blocked by our firewall.'
    });
    this.nhs111Text = page.locator('p', {
      hasText: 'If you need urgent medical advice'
    });
    this.nhs111Link = page.locator('a', { hasText: 'go to NHS 111' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageContainer.waitFor();
  }

  async getNhs111LinkHref(): Promise<string | null> {
    return await this.nhs111Link.getAttribute('href');
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Back link is not supported on this page'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.WafErrorPage];
  }
}
