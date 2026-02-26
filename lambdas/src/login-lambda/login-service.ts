import { type JwtPayload } from 'jsonwebtoken';
import { type INhsLoginClient } from '../lib/login/nhs-login-client';
import { type ITokenService } from '../lib/login/token-service';
import { type INhsTokenResponseModel } from '../lib/models/nhs-login/nhs-login-token-response-model';
import { type INhsUserInfoResponseModel } from '../lib/models/nhs-login/nhs-login-user-info-response-model';
import { TEST_FIRST_NAMES } from '../lib/login/test-user-mapping';
import { type LoginBody } from '.';

// ALPHA: This file will need revisiting.
export interface ILoginService {
  performLogin: (loginBody: LoginBody) => Promise<ILoginOutput>;
}

export interface ILoginOutput {
  userInfoResponse: INhsUserInfoResponseModel;
  nhsLoginAccessToken: string;
  nhsLoginRefreshToken?: string;
}

export interface LoginServiceParams {
  tokenService: ITokenService;
  nhsLoginClient: INhsLoginClient;
  sessionMaxDurationMinutes: number;
}

export class LoginService {
  readonly tokenService: ITokenService;
  readonly nhsLoginClient: INhsLoginClient;

  // ALPHA: Removed commons use. To be reintroduced for logging later.
  constructor(params: LoginServiceParams) {
    this.tokenService = params.tokenService;
    this.nhsLoginClient = params.nhsLoginClient;
  }

  public async performLogin(loginBody: LoginBody): Promise<ILoginOutput> {
    try {
      const tokenResponse: INhsTokenResponseModel =
        await this.nhsLoginClient.getUserTokens(loginBody.code);
      const nhsLoginIdToken = await this.tokenService.verifyToken(
        tokenResponse.id_token
      );
      await this.tokenService.verifyToken(tokenResponse.access_token);
      const idTokenPayload = nhsLoginIdToken.payload as JwtPayload;

      const userInfoResponse: INhsUserInfoResponseModel =
        await this.nhsLoginClient.getUserInfo(tokenResponse.access_token);

      if (idTokenPayload.sub !== userInfoResponse.sub) {
        const errorMessage =
          'The sub claim in the user info response does not match the sub claim in the id token';
        throw new Error(errorMessage);
      }

      // ALPHA: Enrich user info with test data for missing given_name (temporary workaround)
      const enrichedUserInfo = this.enrichUserInfoForTesting(userInfoResponse);

      return {
        userInfoResponse: enrichedUserInfo,
        nhsLoginAccessToken: tokenResponse.access_token,
        nhsLoginRefreshToken: tokenResponse.refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enriches user info with test data for known test users (temporary workaround)
   * Fills in missing given_name based on family_name lookup
   * ALPHA: TODO: Remove this when the given_name (profile_extended) scope is available from NHS Login
   * @param userInfo - The user info response from NHS Login
   * @returns Enriched user info with given_name populated if missing
   */
  private enrichUserInfoForTesting(
    userInfo: INhsUserInfoResponseModel
  ): INhsUserInfoResponseModel {
    if (userInfo.given_name) {
      return userInfo;
    }

    const testFirstName = TEST_FIRST_NAMES[userInfo.family_name];
    if (testFirstName) {
      return { ...userInfo, given_name: testFirstName };
    }

    return userInfo;
  }
}
