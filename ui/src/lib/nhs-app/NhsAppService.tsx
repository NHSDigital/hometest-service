import { nhsAppUrl } from '../../settings';

export class NhsAppService {
  public createNhsAppRedirectorUri({
    urlSource
  }: {
    urlSource?: string;
  } = {}): string {
    const query = urlSource ? `?s=${urlSource}` : '';
    const ssoTarget = `${window.location.origin}/sso${query}`;

    return `${nhsAppUrl}/redirector?redirect_to=${encodeURIComponent(ssoTarget)}`;
  }
}
