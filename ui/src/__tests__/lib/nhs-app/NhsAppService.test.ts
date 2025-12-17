import { NhsAppService } from '../../../lib/nhs-app/NhsAppService';
import { nhsAppUrl } from '../../../settings';

describe('createNhsAppRedirectorUri', () => {
  const nhsAppService = new NhsAppService();
  const baseOrigin = 'http://mock-digital-health-checks.com';
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  it.each([
    {
      urlSource: 'AA',
      expectedTarget: `${baseOrigin}/sso?s=AA`,
      description: 'Redirects correctly to sso?s=param when urlSource provided'
    },
    {
      urlSource: undefined,
      expectedTarget: `${baseOrigin}/sso`,
      description: 'Redirects correctly to /sso when urlSource not provided'
    }
  ])('$description', ({ urlSource, expectedTarget }) => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL(`${baseOrigin}`)
    });

    const result = nhsAppService.createNhsAppRedirectorUri({
      urlSource
    });
    expect(result).toBe(
      `${nhsAppUrl}/redirector?redirect_to=${encodeURIComponent(expectedTarget)}`
    );
  });
});
