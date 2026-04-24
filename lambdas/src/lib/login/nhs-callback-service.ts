import { type INhsTokenResponseModel } from "../models/nhs-login/nhs-login-token-response-model";
import { type INhsUserInfoResponseModel } from "../models/nhs-login/nhs-login-user-info-response-model";
import { type INhsLoginClient } from "./nhs-login-client";
import { type INhsTokenVerifier } from "./nhs-token-verifier";

export interface INhsCallbackResult {
  userInfo: INhsUserInfoResponseModel;
  nhsAccessToken: string;
  nhsRefreshToken?: string;
  idTokenSubject: string;
}

export type NhsCallbackErrorCode =
  | "TOKEN_EXCHANGE_FAILED"
  | "ID_TOKEN_VERIFICATION_FAILED"
  | "ACCESS_TOKEN_VERIFICATION_FAILED"
  | "ID_TOKEN_SUB_MISSING"
  | "USER_INFO_FAILED"
  | "SUBJECT_MISMATCH";

export interface NhsCallbackError {
  code: NhsCallbackErrorCode;
  message: string;
}

export interface NhsCallbackSuccess {
  success: true;
  result: INhsCallbackResult;
}

export interface NhsCallbackFailure {
  success: false;
  error: NhsCallbackError;
}

export type NhsCallbackExecutionResult = NhsCallbackSuccess | NhsCallbackFailure;

export interface INhsCallbackService {
  executeCallback: (code: string) => Promise<NhsCallbackExecutionResult>;
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

  public async executeCallback(code: string): Promise<NhsCallbackExecutionResult> {
    let tokenResponse: INhsTokenResponseModel;

    try {
      tokenResponse = await this.nhsLoginClient.getUserTokens(code);
    } catch {
      return this.failure("TOKEN_EXCHANGE_FAILED", "Unable to exchange NHS authorization code");
    }

    const idTokenResult = await this.nhsTokenVerifier.verifyToken(tokenResponse.id_token);

    if (!idTokenResult.success) {
      return this.failure("ID_TOKEN_VERIFICATION_FAILED", "Unable to verify NHS identity token");
    }

    const accessTokenResult = await this.nhsTokenVerifier.verifyToken(tokenResponse.access_token);

    if (!accessTokenResult.success) {
      return this.failure("ACCESS_TOKEN_VERIFICATION_FAILED", "Unable to verify NHS access token");
    }

    const idTokenSubject = idTokenResult.payload.sub;

    if (!idTokenSubject) {
      return this.failure(
        "ID_TOKEN_SUB_MISSING",
        "NHS identity token is missing a required subject claim",
      );
    }

    let userInfo: INhsUserInfoResponseModel;

    try {
      userInfo = await this.nhsLoginClient.getUserInfo(tokenResponse.access_token);
    } catch {
      return this.failure("USER_INFO_FAILED", "Unable to retrieve NHS user information");
    }

    if (userInfo.sub !== idTokenSubject) {
      return this.failure(
        "SUBJECT_MISMATCH",
        "NHS user information does not match the verified identity token",
      );
    }

    return {
      success: true,
      result: {
        userInfo,
        nhsAccessToken: tokenResponse.access_token,
        nhsRefreshToken: tokenResponse.refresh_token || undefined,
        idTokenSubject,
      },
    };
  }

  private failure(code: NhsCallbackErrorCode, message: string): NhsCallbackFailure {
    return {
      success: false,
      error: {
        code,
        message,
      },
    };
  }
}
