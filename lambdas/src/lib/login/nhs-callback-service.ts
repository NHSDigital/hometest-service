import { type INhsUserInfoResponseModel } from "../models/nhs-login/nhs-login-user-info-response-model";
import { type INhsLoginClient } from "./nhs-login-client";
import { type INhsTokenVerifier } from "./nhs-token-verifier";

export interface INhsCallbackResult {
  userInfo: INhsUserInfoResponseModel;
  nhsAccessToken: string;
  nhsRefreshToken?: string;
  idTokenSubject: string;
}

export interface INhsCallbackService {
  executeCallback: (code: string) => Promise<INhsCallbackResult>;
}

export interface NhsCallbackServiceParams {
  nhsTokenVerifier: INhsTokenVerifier;
  nhsLoginClient: INhsLoginClient;
}

export class NhsCallbackService implements INhsCallbackService {
  private readonly nhsTokenVerifier: INhsTokenVerifier;
  private readonly nhsLoginClient: INhsLoginClient;

  constructor(params: NhsCallbackServiceParams) {
    this.nhsTokenVerifier = params.nhsTokenVerifier;
    this.nhsLoginClient = params.nhsLoginClient;
  }

  public async executeCallback(code: string): Promise<INhsCallbackResult> {
    const tokenResponse = await this.nhsLoginClient.getUserTokens(code);

    const idTokenResult = await this.nhsTokenVerifier.verifyToken(tokenResponse.id_token);

    if (!idTokenResult.success) {
      throw new Error(`NHS id_token verification failed: ${idTokenResult.error.message}`);
    }

    const accessTokenResult = await this.nhsTokenVerifier.verifyToken(tokenResponse.access_token);

    if (!accessTokenResult.success) {
      throw new Error(`NHS access_token verification failed: ${accessTokenResult.error.message}`);
    }

    const idTokenSubject = idTokenResult.payload.sub;

    if (!idTokenSubject) {
      throw new Error("NHS id_token does not contain a sub claim");
    }

    const userInfo = await this.nhsLoginClient.getUserInfo(tokenResponse.access_token);

    if (userInfo.sub !== idTokenSubject) {
      throw new Error(
        "The sub claim in the user info response does not match the sub claim in the id token",
      );
    }

    return {
      userInfo,
      nhsAccessToken: tokenResponse.access_token,
      nhsRefreshToken: tokenResponse.refresh_token || undefined,
      idTokenSubject,
    };
  }
}
