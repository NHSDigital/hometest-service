import { nhsLogin } from '../../settings';

export class NhsLoginService {
  /**
   * @param assertedLoginIdentity Optional. A token provided by a relying party and used for Single Sign On to NHS login.
   * @param stateParams Optional. Values which need to be retained upon redirection back from NHS login.
   */
  public createAuthorizeUri({
    assertedLoginIdentity,
    stateParams
  }: {
    assertedLoginIdentity?: string;
    stateParams?: Record<string, string>;
  } = {}): string {
    const encodedState = new URLSearchParams(stateParams).toString();
    const nhsLoginParams: Record<string, string> = {
      scope: 'openid profile email gp_registration_details profile_extended',
      response_type: 'code',
      client_id: nhsLogin.clientId,
      redirect_uri: nhsLogin.redirectUrl,
      state: encodedState,
      nonce: 'nonce'
    };

    if (assertedLoginIdentity) {
      nhsLoginParams.asserted_login_identity = assertedLoginIdentity;
    }

    const nhsLoginUrlParams = new URLSearchParams(nhsLoginParams);

    return `${nhsLogin.baseUrl}/authorize?${nhsLoginUrlParams.toString()}`;
  }
}
