import { NhsLoginService } from '../../../lib/nhs-login/NhsLoginService';

type NhsLoginUriTestCase = {
  assertedLoginIdentity?: string;
  stateParams?: Record<string, string>;
  expected: string;
  description: string;
};

const cases: NhsLoginUriTestCase[] = [
  {
    assertedLoginIdentity: undefined,
    stateParams: {},
    expected:
      'http://mock-nhs-login.com/authorize?scope=openid+profile+email+gp_registration_details+profile_extended&response_type=code&client_id=mock-client-id&redirect_uri=http%3A%2F%2Fmock-digital-health-checks.com&state=&nonce=nonce',
    description: 'with empty state'
  },
  {
    assertedLoginIdentity: undefined,
    stateParams: { urlSource: 'nudge' },
    expected:
      'http://mock-nhs-login.com/authorize?scope=openid+profile+email+gp_registration_details+profile_extended&response_type=code&client_id=mock-client-id&redirect_uri=http%3A%2F%2Fmock-digital-health-checks.com&state=urlSource%3Dnudge&nonce=nonce',
    description: 'with correct state'
  },
  {
    assertedLoginIdentity: 'nhs-login-sso-token',
    stateParams: {},
    expected:
      'http://mock-nhs-login.com/authorize?scope=openid+profile+email+gp_registration_details+profile_extended&response_type=code&client_id=mock-client-id&redirect_uri=http%3A%2F%2Fmock-digital-health-checks.com&state=&nonce=nonce&asserted_login_identity=nhs-login-sso-token',
    description: 'with SSO token and empty state'
  },
  {
    assertedLoginIdentity: 'nhs-login-sso-token',
    stateParams: { urlSource: 'nudge' },
    expected:
      'http://mock-nhs-login.com/authorize?scope=openid+profile+email+gp_registration_details+profile_extended&response_type=code&client_id=mock-client-id&redirect_uri=http%3A%2F%2Fmock-digital-health-checks.com&state=urlSource%3Dnudge&nonce=nonce&asserted_login_identity=nhs-login-sso-token',
    description: 'with SSO token and correct state'
  }
];

describe('createAuthorizeUri', () => {
  it.each(cases)(
    'creates a valid SSO login URI $description',
    ({ assertedLoginIdentity, stateParams, expected }) => {
      // arrange
      const nhsLoginService = new NhsLoginService();

      // act
      const result = nhsLoginService.createAuthorizeUri({
        assertedLoginIdentity,
        stateParams
      });

      // assert
      expect(result).toBe(expected);
    }
  );
});
