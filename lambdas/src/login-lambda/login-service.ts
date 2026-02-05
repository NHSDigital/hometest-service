import { type JwtPayload } from 'jsonwebtoken';
import { type INhsLoginClient } from '../lib/login/nhs-login-client';
import { type ITokenService } from '../lib/login/token-service';
import { type INhsTokenResponseModel } from '../lib/models/nhs-login/nhs-login-token-response-model';
import { type INhsUserInfoResponseModel } from '../lib/models/nhs-login/nhs-login-user-info-response-model';
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

      return {
        userInfoResponse,
        nhsLoginAccessToken: tokenResponse.access_token,
        nhsLoginRefreshToken: tokenResponse.refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }
}
